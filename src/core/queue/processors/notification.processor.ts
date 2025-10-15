import { Job } from 'bullmq';
import { BaseProcessor } from '../base.processor';
import logger from '@/common/utils/logger.util';

/**
 * Notification job data interface
 */
export interface NotificationJobData {
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  data?: Record<string, unknown>;
  channels?: Array<'push' | 'email' | 'sms'>;
}

/**
 * Notification processor for handling push notifications
 */
export class NotificationProcessor extends BaseProcessor<NotificationJobData> {
  constructor() {
    super('notification');
  }

  /**
   * Process notification job
   */
  async process(
    job: Job<NotificationJobData>
  ): Promise<{ sent: boolean; channels: string[] }> {
    const { userId, title, type, channels = ['push'] } = job.data;

    logger.info('Processing notification job', {
      jobId: job.id,
      userId,
      title,
      type,
      channels,
    });

    try {
      const sentChannels: string[] = [];

      // Process each notification channel
      for (const channel of channels) {
        await job.updateProgress((sentChannels.length / channels.length) * 100);

        switch (channel) {
          case 'push':
            await this.sendPushNotification(job.data);
            sentChannels.push('push');
            break;
          case 'email':
            await this.sendEmailNotification(job.data);
            sentChannels.push('email');
            break;
          case 'sms':
            await this.sendSmsNotification(job.data);
            sentChannels.push('sms');
            break;
          default:
            logger.warn(`Unknown notification channel: ${channel}`);
        }
      }

      await job.updateProgress(100);

      logger.info('Notification sent successfully', {
        jobId: job.id,
        userId,
        sentChannels,
      });

      return { sent: true, channels: sentChannels };
    } catch (error) {
      logger.error('Error sending notification', {
        jobId: job.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Send push notification
   */
  private async sendPushNotification(data: NotificationJobData): Promise<void> {
    // TODO: Integrate with push notification service (FCM, APNs, etc.)
    logger.debug('Sending push notification', {
      userId: data.userId,
      title: data.title,
    });

    await this.delay(300);

    logger.info('Push notification sent:', {
      userId: data.userId,
      title: data.title,
      message: data.message,
      type: data.type,
    });
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(
    data: NotificationJobData
  ): Promise<void> {
    // TODO: Queue an email job instead
    logger.debug('Sending email notification', {
      userId: data.userId,
      title: data.title,
    });

    await this.delay(300);

    logger.info('Email notification sent:', {
      userId: data.userId,
      title: data.title,
    });
  }

  /**
   * Send SMS notification
   */
  private async sendSmsNotification(data: NotificationJobData): Promise<void> {
    // TODO: Integrate with SMS service (Twilio, AWS SNS, etc.)
    logger.debug('Sending SMS notification', {
      userId: data.userId,
      title: data.title,
    });

    await this.delay(300);

    logger.info('SMS notification sent:', {
      userId: data.userId,
      title: data.title,
    });
  }

  /**
   * Helper function to simulate async operations
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
