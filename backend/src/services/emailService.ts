import nodemailer from 'nodemailer';
import { config } from '../config.js';
import logger from '../utils/logger.js';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

let transporter: nodemailer.Transporter | null = null;

function initializeTransporter() {
  if (transporter) return transporter;

  if (config.smtpHost && config.smtpPort) {
    transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpSecure || true,
      auth: config.smtpUser && config.smtpPassword ? {
        user: config.smtpUser,
        pass: config.smtpPassword,
      } : undefined,
    });
  } else {
    logger.warn('Email configuration not set. Emails will not be sent.');
  }

  return transporter;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const transport = initializeTransporter();
    if (!transport) {
      logger.warn('Email transporter not configured. Skipping email send.', {
        to: options.to,
        subject: options.subject,
      });
      return false;
    }

    await transport.sendMail({
      from: config.emailFrom || 'noreply@featureflags.local',
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    logger.info('Email sent successfully', {
      to: options.to,
      subject: options.subject,
    });
    return true;
  } catch (error) {
    logger.error('Failed to send email', {
      to: options.to,
      subject: options.subject,
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

// Email templates
export const emailTemplates = {
  userApproved: (email: string, role: string) => ({
    subject: 'Your Feature Flags Account Has Been Approved',
    html: `
      <h2>Welcome to Feature Flags!</h2>
      <p>Hello,</p>
      <p>Your account has been approved with the role of <strong>${role}</strong>.</p>
      <p>You can now log in and start managing feature flags.</p>
      <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" style="padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px;">
        Go to Dashboard
      </a>
      <p>Best regards,<br>Feature Flags Team</p>
    `,
    text: `
      Welcome to Feature Flags!

      Your account has been approved with the role of ${role}.
      You can now log in and start managing feature flags.

      Visit: ${process.env.FRONTEND_URL || 'http://localhost:3000'}

      Best regards,
      Feature Flags Team
    `,
  }),

  userRejected: (email: string) => ({
    subject: 'Feature Flags Account Status',
    html: `
      <h2>Feature Flags Account Decision</h2>
      <p>Hello,</p>
      <p>Unfortunately, your request to join Feature Flags has been rejected at this time.</p>
      <p>If you believe this is an error, please contact the administrator.</p>
      <p>Best regards,<br>Feature Flags Team</p>
    `,
    text: `
      Feature Flags Account Decision

      Hello,

      Unfortunately, your request to join Feature Flags has been rejected at this time.
      If you believe this is an error, please contact the administrator.

      Best regards,
      Feature Flags Team
    `,
  }),

  flagUpdated: (email: string, flagKey: string, action: string, actorEmail: string) => ({
    subject: `Feature Flag "${flagKey}" was ${action}`,
    html: `
      <h2>Feature Flag Update Notification</h2>
      <p>Hello,</p>
      <p>The feature flag <strong>${flagKey}</strong> was ${action} by ${actorEmail}.</p>
      <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/flags" style="padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px;">
        View Flag
      </a>
      <p>Best regards,<br>Feature Flags Team</p>
    `,
    text: `
      Feature Flag Update Notification

      Hello,

      The feature flag ${flagKey} was ${action} by ${actorEmail}.

      Visit: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/flags

      Best regards,
      Feature Flags Team
    `,
  }),
};
