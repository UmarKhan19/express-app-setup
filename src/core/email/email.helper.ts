import { emailService, IEmailOptions } from '@/core/email';
import { queueService } from '@/core/queue';
import { EmailJobData } from '@/core/queue/processors/email.processor';
import config from '@/config';
import logger from '@/common/utils/logger.util';

/**
 * Email helper utility
 * Provides convenient methods for sending emails
 */
export class EmailHelper {
  /**
   * Send an email immediately (not queued)
   */
  static async sendNow(options: IEmailOptions) {
    return await emailService.send(options);
  }

  /**
   * Send an email via queue (recommended for production)
   */
  static async sendViaQueue(
    options: IEmailOptions,
    jobOptions?: {
      delay?: number;
      priority?: number;
      attempts?: number;
    }
  ) {
    if (!config.queue.enabled || !queueService.isConnected()) {
      logger.warn('Queue is not available, sending email directly');
      return await emailService.send(options);
    }

    const emailJobData: EmailJobData = {
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      from: options.from,
      cc: options.cc,
      bcc: options.bcc,
      replyTo: options.replyTo,
      attachments: options.attachments?.map((att) => ({
        filename: att.filename,
        content: Buffer.isBuffer(att.content)
          ? att.content.toString('base64')
          : att.content,
        contentType: att.contentType,
        encoding:
          att.encoding || (Buffer.isBuffer(att.content) ? 'base64' : undefined),
      })),
      headers: options.headers,
    };

    const job = await queueService.addJob(
      'email',
      'send-email',
      emailJobData,
      jobOptions
    );

    return {
      success: true,
      jobId: job.id,
      message: 'Email queued for sending',
    };
  }

  /**
   * Send a welcome email
   */
  static async sendWelcomeEmail(to: string, userName: string, useQueue = true) {
    const options: IEmailOptions = {
      to,
      subject: 'Welcome to Our Application!',
      html: `
        <h1>Welcome ${userName}!</h1>
        <p>Thank you for joining our application.</p>
        <p>We're excited to have you on board!</p>
        <p>Best regards,<br/>The Team</p>
      `,
      text: `Welcome ${userName}! Thank you for joining our application. We're excited to have you on board! Best regards, The Team`,
    };

    return useQueue
      ? await this.sendViaQueue(options)
      : await this.sendNow(options);
  }

  /**
   * Send a password reset email
   */
  static async sendPasswordResetEmail(
    to: string,
    resetToken: string,
    resetUrl: string,
    useQueue = true
  ) {
    const options: IEmailOptions = {
      to,
      subject: 'Password Reset Request',
      html: `
        <h2>Password Reset Request</h2>
        <p>You have requested to reset your password.</p>
        <p>Click the link below to reset your password:</p>
        <a href="${resetUrl}?token=${resetToken}">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
      text: `Password Reset Request. You have requested to reset your password. Visit: ${resetUrl}?token=${resetToken}. This link will expire in 1 hour. If you didn't request this, please ignore this email.`,
    };

    return useQueue
      ? await this.sendViaQueue(options, { priority: 1 })
      : await this.sendNow(options);
  }

  /**
   * Send a verification email
   */
  static async sendVerificationEmail(
    to: string,
    verificationToken: string,
    verificationUrl: string,
    useQueue = true
  ) {
    const options: IEmailOptions = {
      to,
      subject: 'Verify Your Email Address',
      html: `
        <h2>Email Verification</h2>
        <p>Please verify your email address by clicking the link below:</p>
        <a href="${verificationUrl}?token=${verificationToken}">Verify Email</a>
        <p>This link will expire in 24 hours.</p>
      `,
      text: `Email Verification. Please verify your email address by visiting: ${verificationUrl}?token=${verificationToken}. This link will expire in 24 hours.`,
    };

    return useQueue
      ? await this.sendViaQueue(options)
      : await this.sendNow(options);
  }

  /**
   * Send a notification email
   */
  static async sendNotificationEmail(
    to: string | string[],
    subject: string,
    message: string,
    useQueue = true
  ) {
    const options: IEmailOptions = {
      to,
      subject,
      html: `
        <h2>${subject}</h2>
        <p>${message}</p>
      `,
      text: `${subject}\n\n${message}`,
    };

    return useQueue
      ? await this.sendViaQueue(options)
      : await this.sendNow(options);
  }
}
