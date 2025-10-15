import {
  IEmailService,
  IEmailProvider,
  IEmailOptions,
  IEmailResult,
} from './email.interface';
import { EmailProviderFactory } from './email.factory';
import logger from '@/common/utils/logger.util';

/**
 * Email service
 * Manages email sending through configured providers
 */
class EmailService implements IEmailService {
  private provider!: IEmailProvider;
  private initialized = false;

  /**
   * Initialize email service
   */
  initialize(): void {
    if (this.initialized) {
      logger.warn('Email service already initialized');
      return;
    }

    try {
      this.provider = EmailProviderFactory.createProvider();

      if (!this.provider.isConfigured()) {
        logger.warn(
          `Email provider ${this.provider.getName()} is not properly configured`
        );
      } else {
        logger.info(
          `Email service initialized with provider: ${this.provider.getName()}`
        );
      }

      this.initialized = true;
    } catch (error) {
      logger.error('Failed to initialize email service:', error);
      throw error;
    }
  }

  /**
   * Send an email
   */
  async send(options: IEmailOptions): Promise<IEmailResult> {
    if (!this.initialized) {
      throw new Error('Email service is not initialized');
    }

    if (!this.provider.isConfigured()) {
      const error = `Email provider ${this.provider.getName()} is not configured`;
      logger.error(error);
      return {
        success: false,
        error,
      };
    }

    return await this.provider.send(options);
  }

  /**
   * Get current provider
   */
  getProvider(): IEmailProvider {
    if (!this.initialized) {
      throw new Error('Email service is not initialized');
    }
    return this.provider;
  }

  /**
   * Check if email service is configured
   */
  isConfigured(): boolean {
    return this.initialized && this.provider?.isConfigured();
  }

  /**
   * Get provider name
   */
  getProviderName(): string {
    return this.initialized ? this.provider.getName() : 'none';
  }
}

export default new EmailService();
