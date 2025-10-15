import {
  IEmailProvider,
  IEmailOptions,
  IEmailResult,
} from '../email.interface';
import logger from '@/common/utils/logger.util';

/**
 * Base email provider abstract class
 * All email providers should extend this class
 */
export abstract class BaseEmailProvider implements IEmailProvider {
  protected providerName: string;

  constructor(providerName: string) {
    this.providerName = providerName;
  }

  /**
   * Send an email - must be implemented by child classes
   */
  abstract send(options: IEmailOptions): Promise<IEmailResult>;

  /**
   * Check if provider is configured - must be implemented by child classes
   */
  abstract isConfigured(): boolean;

  /**
   * Get provider name
   */
  getName(): string {
    return this.providerName;
  }

  /**
   * Validate email options
   */
  protected validateOptions(options: IEmailOptions): void {
    if (!options.to) {
      throw new Error('Email recipient (to) is required');
    }

    if (!options.subject) {
      throw new Error('Email subject is required');
    }

    if (!options.html && !options.text) {
      throw new Error('Email must have either html or text content');
    }
  }

  /**
   * Log email sending
   */
  protected logEmailSending(options: IEmailOptions): void {
    logger.info(`Sending email via ${this.providerName}`, {
      provider: this.providerName,
      to: options.to,
      subject: options.subject,
      hasAttachments: !!options.attachments?.length,
    });
  }

  /**
   * Log email success
   */
  protected logEmailSuccess(
    result: IEmailResult,
    options: IEmailOptions
  ): void {
    logger.info(`Email sent successfully via ${this.providerName}`, {
      provider: this.providerName,
      to: options.to,
      subject: options.subject,
      messageId: result.messageId,
    });
  }

  /**
   * Log email error
   */
  protected logEmailError(error: Error, options: IEmailOptions): void {
    logger.error(`Failed to send email via ${this.providerName}`, {
      provider: this.providerName,
      to: options.to,
      subject: options.subject,
      error: error.message,
    });
  }
}
