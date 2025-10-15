/**
 * Email attachment interface
 */
export interface IEmailAttachment {
  filename: string;
  content: string | Buffer;
  contentType?: string;
  encoding?: string;
}

/**
 * Email options interface
 */
export interface IEmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
  attachments?: IEmailAttachment[];
  headers?: Record<string, string>;
}

/**
 * Email send result interface
 */
export interface IEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Email provider interface
 */
export interface IEmailProvider {
  /**
   * Send an email
   */
  send(options: IEmailOptions): Promise<IEmailResult>;

  /**
   * Get provider name
   */
  getName(): string;

  /**
   * Check if provider is configured
   */
  isConfigured(): boolean;
}

/**
 * Email service interface
 */
export interface IEmailService {
  /**
   * Send an email using the configured provider
   */
  send(options: IEmailOptions): Promise<IEmailResult>;

  /**
   * Get the current provider
   */
  getProvider(): IEmailProvider;

  /**
   * Check if email service is configured
   */
  isConfigured(): boolean;
}
