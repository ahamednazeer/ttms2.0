import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { SendMailOptions, Transporter } from 'nodemailer';
import {
  accountProvisionedTemplate,
  accountUpdatedTemplate,
  driverAssignedTemplate,
  invoiceGeneratedTemplate,
  passwordResetTemplate,
  rideAssignedTemplate,
  rideCompletedTemplate,
  rideRequestedTemplate,
  rideStartedTemplate,
  vendorJourneyCompletedTemplate,
  vendorQueueTemplate,
} from './notification-templates';

interface Recipient {
  email?: string;
  name?: string;
}

interface JourneyDetails {
  requesterName?: string;
  pickup?: string;
  drop?: string;
  city?: string;
  date?: string;
  vehicleNo?: string;
  driverName?: string;
  contact?: string;
  otp?: string;
  cost?: number;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private transporter: Transporter | null = null;

  constructor(private readonly configService: ConfigService) {}

  async sendAccountProvisioned(user: Recipient & { username: string; role: string }, password?: string) {
    const template = accountProvisionedTemplate(user, password, this.getPortalUrl());
    return this.send({
      to: this.formatRecipient(user),
      subject: 'TTMS account created',
      ...template,
    });
  }

  async sendAccountUpdated(user: Recipient & { username: string }, changes: string[]) {
    if (!changes.length) return false;
    const template = accountUpdatedTemplate(user, changes, this.getPortalUrl());
    return this.send({
      to: this.formatRecipient(user),
      subject: 'TTMS account updated',
      ...template,
    });
  }

  async sendRideRequested(user: Recipient, journey: JourneyDetails) {
    const template = rideRequestedTemplate(user, journey, `${this.getPortalUrl()}/citizen`);
    return this.send({
      to: this.formatRecipient(user),
      subject: 'TTMS journey request received',
      ...template,
    });
  }

  async sendVendorQueueAlerts(recipients: Recipient[], journey: JourneyDetails) {
    const uniqueRecipients = this.uniqueRecipients(recipients);
    await Promise.allSettled(
      uniqueRecipients.map((recipient) => {
        const template = vendorQueueTemplate(recipient, journey, `${this.getPortalUrl()}/vendor/tickets`);
        return this.send({
          to: this.formatRecipient(recipient),
          subject: 'New TTMS dispatch request awaiting assignment',
          ...template,
        });
      }),
    );
    return true;
  }

  async sendRideAssigned(user: Recipient, journey: JourneyDetails) {
    const template = rideAssignedTemplate(user, journey, `${this.getPortalUrl()}/citizen`);
    return this.send({
      to: this.formatRecipient(user),
      subject: 'Your TTMS ride has been assigned',
      ...template,
    });
  }

  async sendDriverAssigned(user: Recipient, journey: JourneyDetails) {
    const template = driverAssignedTemplate(user, journey, `${this.getPortalUrl()}/transport`);
    return this.send({
      to: this.formatRecipient(user),
      subject: 'A TTMS journey was assigned to you',
      ...template,
    });
  }

  async sendRideStarted(user: Recipient, journey: JourneyDetails) {
    const template = rideStartedTemplate(user, journey, `${this.getPortalUrl()}/citizen`);
    return this.send({
      to: this.formatRecipient(user),
      subject: 'Your TTMS journey is in progress',
      ...template,
    });
  }

  async sendRideCompleted(user: Recipient, journey: JourneyDetails) {
    const template = rideCompletedTemplate(user, journey, `${this.getPortalUrl()}/citizen/history`);
    return this.send({
      to: this.formatRecipient(user),
      subject: 'Your TTMS journey was completed',
      ...template,
    });
  }

  async sendVendorJourneyCompleted(recipients: Recipient[], journey: JourneyDetails) {
    const uniqueRecipients = this.uniqueRecipients(recipients);
    await Promise.allSettled(
      uniqueRecipients.map((recipient) => {
        const template = vendorJourneyCompletedTemplate(recipient, journey, `${this.getPortalUrl()}/vendor/tickets`);
        return this.send({
          to: this.formatRecipient(recipient),
          subject: 'A fleet journey is ready for invoicing',
          ...template,
        });
      }),
    );
    return true;
  }

  async sendInvoiceGenerated(recipients: Recipient[], month: number, year: number, totalCost: number, attachment?: { filename: string; content: Buffer }) {
    const uniqueRecipients = this.uniqueRecipients(recipients);
    await Promise.allSettled(
      uniqueRecipients.map((recipient) => {
        const template = invoiceGeneratedTemplate(recipient, month, year, totalCost, `${this.getPortalUrl()}/admin/invoices`);
        return this.send({
          to: this.formatRecipient(recipient),
          subject: `TTMS invoice generated for ${month}/${year}`,
          attachments: attachment ? [attachment] : undefined,
          ...template,
        });
      }),
    );
    return true;
  }

  async sendPasswordReset(user: Recipient, token: string) {
    const resetUrl = `${this.getPortalUrl()}/reset-password?token=${encodeURIComponent(token)}`;
    const template = passwordResetTemplate(user, resetUrl);
    return this.send({
      to: this.formatRecipient(user),
      subject: 'Reset your TTMS password',
      ...template,
    });
  }

  private async send(message: SendMailOptions & { html: string; text: string }) {
    if (!message.to) return false;

    const transporter = this.getTransporter();
    if (!transporter) {
      this.logger.warn(`Email delivery skipped because SMTP is not configured. Subject="${message.subject}" To="${message.to}"`);
      return false;
    }

    try {
      await transporter.sendMail({
        from: this.getFromAddress(),
        ...message,
      });
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email "${message.subject}" to ${message.to}`, error instanceof Error ? error.stack : undefined);
      return false;
    }
  }

  private getTransporter() {
    if (this.transporter) return this.transporter;

    const host = this.configService.get<string>('SMTP_HOST');
    const port = Number(this.configService.get<string>('SMTP_PORT') || 587);
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    if (!host) return null;

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: this.configService.get<string>('SMTP_SECURE') === 'true',
      auth: user && pass ? { user, pass } : undefined,
    });

    return this.transporter;
  }

  private getFromAddress() {
    return this.configService.get<string>('SMTP_FROM') || 'TTMS <no-reply@ttms.local>';
  }

  private getPortalUrl() {
    return this.configService.get<string>('APP_BASE_URL') || 'http://localhost:3000';
  }

  private formatRecipient(recipient: Recipient) {
    if (!recipient.email) return undefined;
    return recipient.name ? `${recipient.name} <${recipient.email}>` : recipient.email;
  }

  private uniqueRecipients(recipients: Recipient[]) {
    const seen = new Set<string>();
    return recipients.filter((recipient) => {
      const email = recipient.email?.trim().toLowerCase();
      if (!email || seen.has(email)) return false;
      seen.add(email);
      return true;
    });
  }
}
