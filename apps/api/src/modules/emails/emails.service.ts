import nodemailer from 'nodemailer';
import { ActivityType, ActivityOutcome } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { ENV } from '../../config/env';
import { AppError } from '../../middleware/errorHandler';

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
}

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'initial_outreach',
    name: 'Initial Cold Outreach - Website & Growth',
    subject: 'Enhancing {{companyName}}\'s Digital Member Experience',
    body: `Hi {{firstName}},

I came across {{companyName}} and was really impressed by your facility and coaching philosophy.

At 7BLOCKS, we build high-converting websites and digital management platforms specifically tailored for modern fitness centers. Looking at your current digital presence ({{website}}), we identified 3 key opportunities to increase new member inquiries and streamline renewals:

1. High-speed, mobile-optimized class scheduling & membership booking.
2. WhatsApp automated reminder integrations for lead capture.
3. Modern luxury brand aesthetic that highlights your trainers and equipment.

Would you be open to a brief 10-minute discovery call this Thursday to explore how we can help {{companyName}} grow?

Best regards,
{{senderName}}
7BLOCKS Development Team`
  },
  {
    id: 'website_proposal',
    name: 'Website Redesign Proposal',
    subject: '7BLOCKS Scope & Proposal for {{companyName}}',
    body: `Hi {{firstName}},

Following our conversation, please find attached our comprehensive proposal for the {{companyName}} website and digital engine.

The proposal covers:
- Complete UI/UX overhaul built on high-performance architecture
- Interactive member timetable and inquiry funnels
- Mobile-first responsiveness and local SEO optimization
- Deployment, hosting setup, and dedicated support

Let me know if you have any questions or when you'd like to review the milestone roadmap.

Warm regards,
{{senderName}}
7BLOCKS`
  },
  {
    id: 'demo_followup',
    name: 'Demo Follow-up & Next Steps',
    subject: '7BLOCKS Demo Video & Walkthrough for {{companyName}}',
    body: `Hi {{firstName}},

Thank you for your interest! As requested, here is the link to your custom demonstration walkthrough:

We've highlighted the member experience, workout tracking, and lead capture dashboards. 

Please let me know your thoughts after reviewing.

Best regards,
{{senderName}}
7BLOCKS`
  }
];

export class EmailsService {
  static getTemplates() {
    return EMAIL_TEMPLATES;
  }

  static renderTemplate(templateId: string, variables: Record<string, string>) {
    const template = EMAIL_TEMPLATES.find(t => t.id === templateId);
    if (!template) {
      throw new AppError('Template not found', 404, 'TEMPLATE_NOT_FOUND');
    }

    let renderedSubject = template.subject;
    let renderedBody = template.body;

    for (const [key, val] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      renderedSubject = renderedSubject.replace(regex, val || '');
      renderedBody = renderedBody.replace(regex, val || '');
    }

    return { subject: renderedSubject, body: renderedBody };
  }

  static isConfigured(): boolean {
    return Boolean(ENV.SMTP_USER && ENV.SMTP_PASSWORD) || Boolean(ENV.SENDGRID_API_KEY);
  }

  static async sendEmail(data: {
    to: string;
    cc?: string;
    bcc?: string;
    subject: string;
    body: string;
    contactId?: string;
  }, userId: string) {
    if (!this.isConfigured()) {
      throw new AppError(
        'Email service is not configured. Please configure SMTP_USER & SMTP_PASSWORD or SENDGRID_API_KEY in your server environment.',
        503,
        'EMAIL_NOT_CONFIGURED'
      );
    }

    const transporter = nodemailer.createTransport({
      host: ENV.SMTP_HOST,
      port: ENV.SMTP_PORT,
      secure: ENV.SMTP_PORT === 465,
      auth: {
        user: ENV.SMTP_USER,
        pass: ENV.SMTP_PASSWORD
      }
    });

    const info = await transporter.sendMail({
      from: ENV.SMTP_FROM,
      to: data.to,
      cc: data.cc,
      bcc: data.bcc,
      subject: data.subject,
      text: data.body,
      html: `<div style="font-family: sans-serif; line-height: 1.6;">${data.body.replace(/\n/g, '<br/>')}</div>`
    });

    // Save Email Log
    const emailLog = await prisma.emailLog.create({
      data: {
        to: data.to,
        cc: data.cc,
        bcc: data.bcc,
        subject: data.subject,
        body: data.body,
        status: 'SENT',
        messageId: info.messageId,
        contactId: data.contactId,
        userId
      }
    });

    // Auto-create EMAIL_SENT activity
    await prisma.activity.create({
      data: {
        type: ActivityType.EMAIL_SENT,
        title: `Email Sent: ${data.subject}`,
        description: `Sent to ${data.to}`,
        contactId: data.contactId,
        userId,
        metadata: { messageId: info.messageId, to: data.to }
      }
    });

    return { success: true, messageId: info.messageId, emailLogId: emailLog.id };
  }

  static async handleWebhook(event: {
    event: 'delivered' | 'open' | 'click' | 'reply' | 'bounce';
    email: string;
    messageId?: string;
    timestamp?: number;
  }) {
    const emailLog = await prisma.emailLog.findFirst({
      where: event.messageId ? { messageId: event.messageId } : { to: event.email },
      orderBy: { createdAt: 'desc' }
    });

    if (!emailLog) return;

    if (event.event === 'open') {
      await prisma.emailLog.update({
        where: { id: emailLog.id },
        data: { status: 'OPENED' }
      });

      if (emailLog.contactId) {
        await prisma.activity.create({
          data: {
            type: ActivityType.EMAIL_OPENED,
            title: `Email Opened by ${event.email}`,
            description: `Subject: "${emailLog.subject}"`,
            outcome: ActivityOutcome.POSITIVE,
            contactId: emailLog.contactId,
            userId: emailLog.userId
          }
        });
      }
    } else if (event.event === 'reply') {
      await prisma.emailLog.update({
        where: { id: emailLog.id },
        data: { status: 'REPLIED' }
      });

      if (emailLog.contactId) {
        await prisma.activity.create({
          data: {
            type: ActivityType.EMAIL_REPLIED,
            title: `Reply Received from ${event.email}`,
            description: `Re: "${emailLog.subject}"`,
            outcome: ActivityOutcome.POSITIVE,
            contactId: emailLog.contactId,
            userId: emailLog.userId
          }
        });

        await prisma.notification.create({
          data: {
            userId: emailLog.userId,
            type: 'EMAIL_REPLY',
            title: 'Email Reply Received',
            message: `${event.email} replied to "${emailLog.subject}"`,
            link: `/contacts/${emailLog.contactId}`
          }
        });
      }
    }
  }
}
