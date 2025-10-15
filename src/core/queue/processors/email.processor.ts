import { Job } from 'bullmq';
import { BaseProcessor } from '../base.processor';
import logger from '@/common/utils/logger.util';
import { emailService } from '@/core/email';

/**
 * Email job data interface
 */
export interface EmailJobData {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  body?: string; // Deprecated, use html or text
  from?: string;
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: string;
    contentType?: string;
    encoding?: string;
  }>;
  headers?: Record<string, string>;
}

/**
 * Email processor for handling email sending jobs
 */
export class EmailProcessor extends BaseProcessor<EmailJobData> {
  constructor() {
    super('email');
  }

  /**
   * Process email job
   */
  async process(
    job: Job<EmailJobData>
  ): Promise<{ sent: boolean; messageId?: string }> {
    const { to, subject, from } = job.data;

    logger.info('Processing email job', {
      jobId: job.id,
      to,
      subject,
      from,
    });

    try {
      // Update job progress
      await job.updateProgress(25);

      // Send email using email service
      const result = await this.sendEmail(job.data);

      await job.updateProgress(75);

      if (!result.success) {
        throw new Error(result.error || 'Failed to send email');
      }

      await job.updateProgress(100);

      logger.info('Email sent successfully', {
        jobId: job.id,
        to,
        subject,
        messageId: result.messageId,
      });

      return {
        sent: true,
        messageId: result.messageId,
      };
    } catch (error) {
      logger.error('Error sending email', {
        jobId: job.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Send email using email service
   */
  private async sendEmail(data: EmailJobData) {
    // Support legacy 'body' field by mapping it to 'html'
    const html = data.html || data.body;
    const text = data.text;

    if (!html && !text) {
      throw new Error('Email must have either html, text, or body content');
    }

    return await emailService.send({
      to: data.to,
      subject: data.subject,
      html,
      text,
      from: data.from,
      cc: data.cc,
      bcc: data.bcc,
      replyTo: data.replyTo,
      attachments: data.attachments,
      headers: data.headers,
    });
  }
}
