import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Invoice, InvoiceDocument } from './schemas/invoice.schema';
import { TicketsService } from '../tickets/tickets.service';
import { VendorsService } from '../vendors/vendors.service';
import * as PDFDocument from 'pdfkit';
import { Response } from 'express';

@Injectable()
export class InvoicesService {
  constructor(
    @InjectModel(Invoice.name) private model: Model<InvoiceDocument>,
    private ticketsService: TicketsService,
    private vendorsService: VendorsService,
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

    return invoice.save();
  }

  async downloadPdf(invoiceId: string, res: Response) {
    const invoice = await this.model.findById(invoiceId).populate('vendorId tickets');
    if (!invoice) throw new NotFoundException('Invoice not found');

    const vendor = await this.vendorsService.findOne(invoice.vendorId.toString());

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoiceId}.pdf`);
    doc.pipe(res);

    // Header
    doc.fontSize(20).text('TTMS - INVOICE', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Invoice ID: ${invoiceId}`);
    doc.text(`Vendor: ${vendor?.vendorName || 'N/A'}`);
    doc.text(`Period: ${invoice.month}/${invoice.year}`);
    doc.text(`Generated: ${invoice.generatedAt.toLocaleDateString()}`);
    doc.moveDown();

    // Table header
    doc.fontSize(10).text('Ticket ID | User | From | To | Cost', { underline: true });
    doc.moveDown(0.5);

    // Ticket rows
    for (const ticket of invoice.tickets as any[]) {
      const line = `${ticket._id} | ${ticket.userId?.firstName || 'N/A'} | ${ticket.pickupLocationId?.locationName || 'N/A'} | ${ticket.dropLocationId?.locationName || 'N/A'} | $${ticket.cost || 0}`;
      doc.text(line);
    }

    doc.moveDown();
    doc.fontSize(14).text(`Total: $${invoice.totalCost.toFixed(2)}`, { align: 'right' });

    doc.end();
  }
}
