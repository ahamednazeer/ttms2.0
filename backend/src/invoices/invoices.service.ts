import { BadRequestException, forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Invoice, InvoiceDocument } from './schemas/invoice.schema';
import { TicketsService } from '../tickets/tickets.service';
import { VendorsService } from '../vendors/vendors.service';
import PDFDocument = require('pdfkit');
import * as fs from 'fs';
import * as path from 'path';
import { Response } from 'express';
import { NotificationsService } from '../notifications/notifications.service';
import { User, UserDocument } from '../users/schemas/user.schema';

interface InvoiceLineItem {
  sNo: number;
  pickupLocation: string;
  dropLocation: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  amount: string;
  rawAmount: number;
}

interface InvoiceRouteSummary {
  sNo: number;
  pickupLocation: string;
  dropLocation: string;
  price: string;
}

@Injectable()
export class InvoicesService {
  private readonly invoicePageSize: [number, number] = [595.28, 870];

  constructor(
    @InjectModel(Invoice.name) private model: Model<InvoiceDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @Inject(forwardRef(() => TicketsService))
    private ticketsService: TicketsService,
    private vendorsService: VendorsService,
    private notificationsService: NotificationsService,
  ) {}

  async findAll() {
    return this.populateInvoiceQuery(this.model.find()).sort({ generatedAt: -1 }).exec();
  }

  async generate(vendorId: string, month: number, year: number) {
    // Check if already exists
    const existing = await this.model.findOne({ vendorId, month, year });
    if (existing) throw new BadRequestException('Invoice already exists for this period');
    const savedInvoice = await this.syncInvoiceForPeriod(vendorId, month, year);
    const vendor = await this.vendorsService.findOne(vendorId);
    const attachment = vendor ? {
      filename: `ttms-invoice-${month}-${year}.pdf`,
      content: await this.generateInvoicePdfBuffer(savedInvoice, vendor),
    } : undefined;
    const recipients = await this.getVendorRecipients(vendorId, vendor);
    this.dispatchNotification(() =>
      this.notificationsService.sendInvoiceGenerated(recipients, month, year, Number(savedInvoice.totalCost || 0), attachment),
    );

    return savedInvoice;
  }

  async sendInvoiceOnJourneyCompletion(ticket: any) {
    const vendorId = this.normalizeRefId(ticket?.vendorId || ticket?.transportId?.vendorId);
    if (!vendorId) return;

    const completedAt = ticket?.rideEndTime || ticket?.pickupDate || new Date();
    const invoiceDate = new Date(completedAt);
    if (Number.isNaN(invoiceDate.getTime())) return;

    const month = invoiceDate.getMonth() + 1;
    const year = invoiceDate.getFullYear();
    const invoice = await this.syncInvoiceForPeriod(vendorId, month, year);
    const vendor = await this.vendorsService.findOne(vendorId);
    const recipients = await this.getVendorRecipients(vendorId, vendor);
    const attachment = {
      filename: `ttms-invoice-${month}-${year}.pdf`,
      content: await this.generateInvoicePdfBuffer(invoice, vendor),
    };

    await this.notificationsService.sendInvoiceGenerated(
      recipients,
      month,
      year,
      Number(invoice.totalCost || 0),
      attachment,
    );
  }

  async downloadPdf(invoiceId: string, res: Response) {
    const invoice = await this.populateInvoiceQuery(this.model.findById(invoiceId)).exec();
    if (!invoice) throw new NotFoundException('Invoice not found');

    const vendor = typeof invoice.vendorId === 'object' && invoice.vendorId !== null && 'vendorName' in invoice.vendorId
      ? invoice.vendorId
      : await this.vendorsService.findOne(this.normalizeRefId(invoice.vendorId));
    const hydratedInvoice = await this.ensureInvoiceTicketDetails(invoice as any);

    const doc = new PDFDocument({ size: this.invoicePageSize, margin: 24 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoiceId}.pdf`);
    doc.pipe(res);
    this.writeInvoicePdf(doc, hydratedInvoice, vendor);
    doc.end();
  }

  private writeInvoicePdf(doc: InstanceType<typeof PDFDocument>, invoice: any, vendor: any) {
    const lineItems = this.buildInvoiceLineItems(invoice.tickets || []);
    const routeSummary = this.buildRouteSummary(lineItems);
    const vendorName = vendor?.vendorName || 'TTMS Vendor';
    const cityName = this.getInvoiceCity(invoice, vendor);
    const passengerName = this.getPassengerDisplayName(invoice.tickets || []);
    const invoiceNumber = this.getInvoiceNumber(invoice);
    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const margin = 22;
    const contentWidth = pageWidth - margin * 2;
    const brandBlue = '#4b5ef0';
    const borderBlue = '#2f3f8e';
    const fillBlue = '#d9e6f6';
    const textDark = '#111111';
    const mutedText = '#5f5f5f';

    doc.font('Helvetica');

    const logoPath = this.getLogoPath();
    if (logoPath) {
      doc.image(logoPath, margin + 38, 58, { fit: [122, 34], align: 'left', valign: 'center' });
    } else {
      doc.fillColor(brandBlue).font('Helvetica-Bold').fontSize(28).text('TTMS', margin + 38, 64);
    }

    doc.fillColor(textDark).font('Helvetica-Bold').fontSize(26).text('INVOICE', pageWidth - margin - 184, 42, {
      width: 184,
      align: 'center',
    });
    doc.font('Helvetica').fontSize(12.5).text(`Invoice No: ${invoiceNumber}`, pageWidth - margin - 190, 84, {
      width: 190,
      align: 'center',
    });

    doc.font('Helvetica').fontSize(15).fillColor(textDark).text(`Bill To: ${vendorName}`, margin + 10, 144);
    doc.text(cityName, margin + 90, 172);

    doc.font('Helvetica-Bold').fontSize(15).text(`Patient Name: ${passengerName}`, margin + 10, 236);
    doc.text(`City: ${cityName}`, margin + 10, 288);

    const detailColumns = [
      { key: 'sNo', label: 'S.No', width: 34, align: 'center' as const },
      { key: 'pickupLocation', label: 'Pickup Location', width: 108, align: 'center' as const },
      { key: 'dropLocation', label: 'Drop Location', width: 110, align: 'center' as const },
      { key: 'startDate', label: 'Start Date', width: 57, align: 'center' as const },
      { key: 'startTime', label: 'Start Time', width: 61, align: 'center' as const },
      { key: 'endDate', label: 'End Date', width: 57, align: 'center' as const },
      { key: 'endTime', label: 'End Time', width: 58, align: 'center' as const },
      { key: 'amount', label: 'Amount', width: 50, align: 'center' as const },
    ];

    doc.save();
    doc.strokeColor('#b7b7b7').lineWidth(1);
    doc.moveTo(margin + 10, 404).lineTo(pageWidth - margin - 14, 404).stroke();
    doc.restore();

    let currentY = 406;
    currentY = this.drawTable(
      doc,
      margin,
      currentY,
      detailColumns,
      lineItems,
      {
        headerFill: brandBlue,
        rowFill: fillBlue,
        borderColor: borderBlue,
        headerTextColor: '#ffffff',
        rowTextColor: '#4a4a4a',
        headerHeight: 36,
        rowHeight: 20,
        fontSize: 7,
      },
    );

    const detailTableWidth = detailColumns.reduce((sum, column) => sum + column.width, 0);
    const totalWidth = 188;
    const totalLabelWidth = 120;
    const totalValueWidth = totalWidth - totalLabelWidth;
    const totalX = margin + detailTableWidth - totalWidth;
    const totalY = currentY + 18;
    doc.save();
    doc.lineWidth(1);
    doc.fillColor(fillBlue).strokeColor(borderBlue);
    doc.rect(totalX, totalY, totalLabelWidth, 30).fillAndStroke();
    doc.rect(totalX + totalLabelWidth, totalY, totalValueWidth, 30).fillAndStroke();
    doc.fillColor(textDark).font('Helvetica-Bold').fontSize(10)
      .text('TOTAL AMOUNT', totalX, totalY + 8, { width: totalLabelWidth, align: 'center' })
      .text(this.formatCurrency(invoice.totalCost || 0), totalX + totalLabelWidth, totalY + 8, {
        width: totalValueWidth,
        align: 'center',
      });
    doc.restore();

    doc.font('Helvetica-Bold').fontSize(17).fillColor(textDark).text(cityName, margin + 42, totalY + 120);

    const summaryColumns = [
      { key: 'sNo', label: 'S.No', width: 36, align: 'center' as const },
      { key: 'pickupLocation', label: 'Pickup Location', width: 165, align: 'center' as const },
      { key: 'dropLocation', label: 'Drop Location', width: 166, align: 'center' as const },
      { key: 'price', label: 'Price', width: 90, align: 'center' as const },
    ];

    const summaryTableY = totalY + 154;
    this.drawTable(
      doc,
      margin + 10,
      summaryTableY,
      summaryColumns,
      routeSummary,
      {
        headerFill: brandBlue,
        rowFill: fillBlue,
        borderColor: borderBlue,
        headerTextColor: '#ffffff',
        rowTextColor: '#4a4a4a',
        headerHeight: 38,
        rowHeight: 24,
        fontSize: 9,
      },
    );

    doc.font('Helvetica-Bold').fontSize(10).fillColor(mutedText).text(
      'Thank you for choosing TTMS. For queries, contact support@ttms.com',
      margin + 10,
      pageHeight - 50,
      { width: contentWidth, align: 'left' },
    );
  }

  private async generateInvoicePdfBuffer(invoice: InvoiceDocument, vendor: any) {
    const hydratedInvoice = await this.populateInvoiceQuery(this.model.findById(invoice._id)).exec();
    if (!hydratedInvoice) throw new NotFoundException('Invoice not found');
    const invoiceWithTicketDetails = await this.ensureInvoiceTicketDetails(hydratedInvoice as any);

    return new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      const doc = new PDFDocument({ size: this.invoicePageSize, margin: 24 });
      doc.on('data', (chunk: Buffer | string) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      this.writeInvoicePdf(doc, invoiceWithTicketDetails, vendor);
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

  private async syncInvoiceForPeriod(vendorId: string, month: number, year: number) {
    const tickets = await this.ticketsService.findByVendorAndPeriod(vendorId, month, year);
    if (tickets.length === 0) throw new BadRequestException('No completed tickets found');

    const totalCost = tickets.reduce((sum, ticket) => sum + Number(ticket.cost || 0), 0);
    const existing = await this.model.findOne({ vendorId, month, year });

    if (existing) {
      existing.tickets = tickets.map((ticket) => ticket._id) as any;
      existing.totalCost = totalCost;
      existing.generatedAt = new Date();
      return existing.save();
    }

    return new this.model({
      vendorId,
      month,
      year,
      tickets: tickets.map((ticket) => ticket._id),
      totalCost,
      generatedAt: new Date(),
    }).save();
  }

  private buildInvoiceLineItems(tickets: any[]): InvoiceLineItem[] {
    return tickets.map((ticket, index) => {
      const fallbackStart = ticket.pickupDate || ticket.createdAt || ticket.rideStartTime;
      const fallbackEnd = ticket.rideEndTime || ticket.rideStartTime || ticket.pickupDate;
      const amount = Number(ticket.cost || 0);

      return {
        sNo: index + 1,
        pickupLocation: this.formatDisplayText(ticket.pickupLocationId?.locationName),
        dropLocation: this.formatDisplayText(ticket.dropLocationId?.locationName),
        startDate: this.formatDate(fallbackStart),
        startTime: this.formatTime(ticket.rideStartTime || fallbackStart),
        endDate: this.formatDate(fallbackEnd),
        endTime: this.formatTime(fallbackEnd),
        amount: this.formatCurrency(amount),
        rawAmount: amount,
      };
    });
  }

  private buildRouteSummary(items: InvoiceLineItem[]): InvoiceRouteSummary[] {
    const routes = new Map<string, { pickupLocation: string; dropLocation: string; rawAmount: number }>();

    for (const item of items) {
      const key = `${item.pickupLocation}__${item.dropLocation}`;
      const existing = routes.get(key);
      if (existing) {
        existing.rawAmount += item.rawAmount;
        continue;
      }

      routes.set(key, {
        pickupLocation: item.pickupLocation,
        dropLocation: item.dropLocation,
        rawAmount: item.rawAmount,
      });
    }

    return Array.from(routes.values()).map((route, index) => ({
      sNo: index + 1,
      pickupLocation: route.pickupLocation,
      dropLocation: route.dropLocation,
      price: this.formatCurrency(route.rawAmount),
    }));
  }

  private drawTable(
    doc: InstanceType<typeof PDFDocument>,
    startX: number,
    startY: number,
    columns: Array<{ key: string; label: string; width: number; align: 'left' | 'center' | 'right' }>,
    rows: Array<any>,
    options: {
      headerFill: string;
      rowFill: string;
      borderColor: string;
      headerTextColor: string;
      rowTextColor: string;
      headerHeight: number;
      rowHeight: number;
      fontSize: number;
    },
  ) {
    let x = startX;
    doc.save();
    doc.lineWidth(1);
    doc.strokeColor(options.borderColor);

    for (const column of columns) {
      doc.fillColor(options.headerFill).rect(x, startY, column.width, options.headerHeight).fillAndStroke();
      doc.fillColor(options.headerTextColor).font('Helvetica-Bold').fontSize(options.fontSize + 1);
      const headerTextHeight = doc.heightOfString(column.label, { width: column.width - 12, align: column.align });
      doc.text(column.label, x + 6, startY + ((options.headerHeight - headerTextHeight) / 2), {
        width: column.width - 12,
        align: column.align,
      });
      x += column.width;
    }

    let y = startY + options.headerHeight;
    for (const row of rows) {
      x = startX;
      for (const column of columns) {
        doc.fillColor(options.rowFill).rect(x, y, column.width, options.rowHeight).fillAndStroke();
        const cellValue = String(row[column.key] ?? '');
        doc.fillColor(options.rowTextColor).font('Helvetica').fontSize(options.fontSize);
        const rowTextHeight = doc.heightOfString(cellValue, { width: column.width - 12, align: column.align });
        doc.text(cellValue, x + 6, y + ((options.rowHeight - rowTextHeight) / 2), {
          width: column.width - 12,
          align: column.align,
        });
        x += column.width;
      }
      y += options.rowHeight;
    }

    doc.restore();
    return y;
  }

  private getInvoiceNumber(invoice: any) {
    const id = String(invoice._id || '').slice(-4).toUpperCase() || '0000';
    return `INV-${id}`;
  }

  private getPassengerDisplayName(tickets: any[]) {
    const names = Array.from(new Set(
      tickets
        .map((ticket) => {
          const user = ticket.userId;
          if (user?.firstName || user?.lastName) {
            return [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
          }
          return ticket.userName || user?.username || '';
        })
        .filter(Boolean),
    ));

    if (!names.length) return 'N/A';
    if (names.length === 1) return this.formatDisplayText(names[0]);
    return 'Multiple Passengers';
  }

  private getInvoiceCity(invoice: any, vendor: any) {
    return this.formatDisplayText(invoice.tickets?.[0]?.cityId?.cityName || vendor?.cityId?.cityName);
  }

  private formatDate(value?: Date | string) {
    if (!value) return 'N/A';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'N/A';

    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  }

  private formatTime(value?: Date | string) {
    if (!value) return 'N/A';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'N/A';

    let hours = date.getHours();
    const minutes = `${date.getMinutes()}`.padStart(2, '0');
    const suffix = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}.${minutes} ${suffix}`;
  }

  private formatCurrency(value: number) {
    return `$${Number(value || 0).toFixed(2)}`;
  }

  private formatDisplayText(value?: string) {
    if (!value) return 'N/A';
    return value
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private normalizeRefId(value: any) {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (value._id) return String(value._id);
    if (value.toString) return value.toString();
    return String(value);
  }

  private populateInvoiceQuery<T>(query: T) {
    return (query as any)
      .populate('vendorId')
      .populate({
        path: 'tickets',
        populate: [
          { path: 'userId' },
          { path: 'cityId' },
          { path: 'pickupLocationId' },
          { path: 'dropLocationId' },
          { path: 'transportId' },
          { path: 'vendorId' },
        ],
      });
  }

  private async ensureInvoiceTicketDetails(invoice: any) {
    const tickets = Array.isArray(invoice?.tickets) ? invoice.tickets : [];
    const hasExpandedTickets = tickets.every(
      (ticket: any) =>
        ticket &&
        typeof ticket === 'object' &&
        ticket.pickupLocationId?.locationName &&
        ticket.dropLocationId?.locationName,
    );

    if (hasExpandedTickets) {
      return invoice;
    }

    const hydratedTickets = await Promise.all(
      tickets.map((ticket: any) => this.ticketsService.findOne(this.normalizeRefId(ticket))),
    );

    return {
      ...invoice.toObject?.() ?? invoice,
      tickets: hydratedTickets,
    };
  }

  private getLogoPath() {
    const candidatePaths = [
      path.resolve(process.cwd(), 'src', 'assets', 'invoice-logo.png'),
      path.resolve(process.cwd(), 'src', 'assets', 'logo.png'),
      path.resolve(process.cwd(), 'backend', 'src', 'assets', 'invoice-logo.png'),
      path.resolve(process.cwd(), 'backend', 'src', 'assets', 'logo.png'),
      path.resolve(__dirname, '..', 'assets', 'invoice-logo.png'),
      path.resolve(__dirname, '..', 'assets', 'logo.png'),
    ];

    return candidatePaths.find((candidatePath) => fs.existsSync(candidatePath));
  }
}
