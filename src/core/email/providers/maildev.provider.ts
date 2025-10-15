import nodemailer, { Transporter } from 'nodemailer';
import { BaseEmailProvider } from './base.provider';
import { IEmailOptions, IEmailResult } from '../email.interface';
import config from '@/config';

/**
 * MailDev email provider
 * Uses nodemailer with SMTP to send emails to MailDev for development
 */
export class MailDevProvider extends BaseEmailProvider {
  private transporter!: Transporter;

  constructor() {
    super('MailDev');
    this.initializeTransporter();
  }

  /**
   * Initialize nodemailer transporter for MailDev
   */
  private initializeTransporter(): void {
    this.transporter = nodemailer.createTransport({
      host: config.email.maildev.host,
      port: config.email.maildev.port,
      secure: config.email.maildev.secure,
      ignoreTLS: true,
      // MailDev doesn't require authentication
      auth: undefined,
    });
  }

  /**
   * Send email via MailDev
   */
  async send(options: IEmailOptions): Promise<IEmailResult> {
    try {
      this.validateOptions(options);
      this.logEmailSending(options);

      const mailOptions = {
        from:
          options.from ||
          `${config.email.from.name} <${config.email.from.email}>`,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        cc: options.cc
          ? Array.isArray(options.cc)
            ? options.cc.join(', ')
            : options.cc
          : undefined,
        bcc: options.bcc
          ? Array.isArray(options.bcc)
            ? options.bcc.join(', ')
            : options.bcc
          : undefined,
        replyTo: options.replyTo,
        attachments: options.attachments?.map((attachment) => ({
          filename: attachment.filename,
          content: attachment.content,
          contentType: attachment.contentType,
          encoding: attachment.encoding,
        })),
        headers: options.headers,
      };

      const info = await this.transporter.sendMail(mailOptions);

      const result: IEmailResult = {
        success: true,
        messageId: info.messageId,
      };

      this.logEmailSuccess(result, options);

      return result;
    } catch (error) {
      const err = error as Error;
      this.logEmailError(err, options);

      return {
        success: false,
        error: err.message,
      };
    }
  }

  /**
   * Check if MailDev is configured
   */
  isConfigured(): boolean {
    return !!(config.email.maildev.host && config.email.maildev.port);
  }
}
