import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Invoice, InvoiceDocument } from './schemas/invoice.schema';
import { TicketsService } from '../tickets/tickets.service';
import { VendorsService } from '../vendors/vendors.service';
import * as PDFDocument from 'pdfkit';
import { Response } from 'express';
import { NotificationsService } from '../notifications/notifications.service';
import { User, UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class InvoicesService {
  constructor(
    @InjectModel(Invoice.name) private model: Model<InvoiceDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private ticketsService: TicketsService,
    private vendorsService: VendorsService,
    private notificationsService: NotificationsService,
  ) {}

  async findAll() {
    return this.model.find().populate('vendorId tickets').sort({ generatedAt: -1 }).exec();
  }

  async generate(vendorId: string, month: number, year: number) {
    // Check if already exists
    const existing = await this.model.findOne({ vendorId, month, year });
    if (existing) throw new BadRequestException('Invoice already exists for this period');

    // Get completed tickets for this vendor/period
    const tickets = await this.ticketsService.findByVendorAndPeriod(vendorId, month, year);
    if (tickets.length === 0) throw new BadRequestException('No completed tickets found');

    const totalCost = tickets.reduce((sum, t) => sum + (t.cost || 0), 0);

    const invoice = new this.model({
      vendorId,
      month,
      year,
      tickets: tickets.map(t => t._id),
      totalCost,
      generatedAt: new Date(),
    });

    const savedInvoice = await invoice.save();
    const vendor = await this.vendorsService.findOne(vendorId);
    const attachment = vendor ? {
      filename: `ttms-invoice-${month}-${year}.pdf`,
      content: await this.generateInvoicePdfBuffer(savedInvoice, vendor),
    } : undefined;
    const recipients = await this.getVendorRecipients(vendorId, vendor);
    this.dispatchNotification(() =>
      this.notificationsService.sendInvoiceGenerated(recipients, month, year, totalCost, attachment),
    );

    return savedInvoice;
  }

  async downloadPdf(invoiceId: string, res: Response) {
    const invoice = await this.model.findById(invoiceId).populate('vendorId tickets');
    if (!invoice) throw new NotFoundException('Invoice not found');

    const vendor = await this.vendorsService.findOne(invoice.vendorId.toString());

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoiceId}.pdf`);
    doc.pipe(res);
    this.writeInvoicePdf(doc, invoice as any, vendor);
    doc.end();
  }

  private writeInvoicePdf(doc: InstanceType<typeof PDFDocument>, invoice: any, vendor: any) {
    doc.fontSize(20).text('TTMS - INVOICE', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Invoice ID: ${invoice._id}`);
    doc.text(`Vendor: ${vendor?.vendorName || 'N/A'}`);
    doc.text(`Period: ${invoice.month}/${invoice.year}`);
    doc.text(`Generated: ${new Date(invoice.generatedAt).toLocaleDateString()}`);
    doc.moveDown();
    doc.fontSize(10).text('Ticket ID | User | From | To | Cost', { underline: true });
    doc.moveDown(0.5);

    for (const ticket of invoice.tickets as any[]) {
      const line = `${ticket._id} | ${ticket.userId?.firstName || 'N/A'} | ${ticket.pickupLocationId?.locationName || 'N/A'} | ${ticket.dropLocationId?.locationName || 'N/A'} | $${ticket.cost || 0}`;
      doc.text(line);
    }

    doc.moveDown();
    doc.fontSize(14).text(`Total: $${Number(invoice.totalCost || 0).toFixed(2)}`, { align: 'right' });
  }

  private async generateInvoicePdfBuffer(invoice: InvoiceDocument, vendor: any) {
    const hydratedInvoice = await this.model.findById(invoice._id).populate('vendorId tickets');
    if (!hydratedInvoice) throw new NotFoundException('Invoice not found');

    return new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      const doc = new PDFDocument({ margin: 50 });
      doc.on('data', (chunk: Buffer | string) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      this.writeInvoicePdf(doc, hydratedInvoice as any, vendor);
      doc.end();
    });
  }

  private async getVendorRecipients(vendorId: string, vendor?: any) {
    const vendorUsers = await this.userModel.find({
      role: 'VENDOR',
      vendorId,
      active: true,
      email: { $exists: true, $ne: '' },
    }).select('email firstName lastName').lean();

    return [
      vendor?.email ? { email: vendor.email, name: vendor.vendorName } : null,
      ...vendorUsers.map((user) => ({
        email: user.email,
        name: [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || undefined,
      })),
    ].filter(Boolean) as Array<{ email: string; name?: string }>;
  }

  private dispatchNotification(task: () => Promise<unknown>) {
    void task().catch(() => undefined);
  }
}
