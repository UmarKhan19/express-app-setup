import { IEmailProvider } from './email.interface';
import { MailDevProvider, ResendProvider } from './providers';
import config from '@/config';
import logger from '@/common/utils/logger.util';

/**
 * Email provider factory
 * Creates the appropriate email provider based on configuration
 */
export class EmailProviderFactory {
  /**
   * Create email provider based on configuration
   */
  static createProvider(): IEmailProvider {
    const providerName = config.email.provider.toLowerCase();

    logger.info(`Creating email provider: ${providerName}`);

    switch (providerName) {
      case 'maildev':
        return new MailDevProvider();

      case 'resend':
        return new ResendProvider();

      default:
        logger.warn(
          `Unknown email provider: ${providerName}, falling back to MailDev`
        );
        return new MailDevProvider();
    }
  }

  /**
   * Get list of available providers
   */
  static getAvailableProviders(): string[] {
    return ['maildev', 'resend'];
  }
}
