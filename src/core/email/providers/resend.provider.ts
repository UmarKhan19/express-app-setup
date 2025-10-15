import { Resend } from 'resend';
import { BaseEmailProvider } from './base.provider';
import { IEmailOptions, IEmailResult } from '../email.interface';
import config from '@/config';

/**
 * Resend email provider
 * Uses Resend API to send production emails
 */
export class ResendProvider extends BaseEmailProvider {
  private resend!: Resend;

  constructor() {
    super('Resend');
    this.initializeResend();
  }

  /**
   * Initialize Resend client
   */
  private initializeResend(): void {
    if (!config.email.resend.apiKey) {
      throw new Error('Resend API key is not configured');
    }

    this.resend = new Resend(config.email.resend.apiKey);
  }

  /**
   * Send email via Resend
   */
  async send(options: IEmailOptions): Promise<IEmailResult> {
    try {
      this.validateOptions(options);
      this.logEmailSending(options);

      // Convert attachments to Resend format if present
      const attachments = options.attachments?.map((attachment) => ({
        filename: attachment.filename,
        content: Buffer.isBuffer(attachment.content)
          ? attachment.content
          : Buffer.from(attachment.content),
      }));

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const emailPayload: any = {
        from:
          options.from ||
          `${config.email.from.name} <${config.email.from.email}>`,
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
        cc: options.cc
          ? Array.isArray(options.cc)
            ? options.cc
            : [options.cc]
          : undefined,
        bcc: options.bcc
          ? Array.isArray(options.bcc)
            ? options.bcc
            : [options.bcc]
          : undefined,
        replyTo: options.replyTo,
        attachments,
        headers: options.headers,
      };

      // Add html or text content
      if (options.html) {
        emailPayload.html = options.html;
      }
      if (options.text) {
        emailPayload.text = options.text;
      }

      const { data, error } = await this.resend.emails.send(emailPayload);

      if (error) {
        this.logEmailError(new Error(error.message), options);
        return {
          success: false,
          error: error.message,
        };
      }

      const result: IEmailResult = {
        success: true,
        messageId: data?.id,
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
   * Check if Resend is configured
   */
  isConfigured(): boolean {
    return !!config.email.resend.apiKey;
  }
}
