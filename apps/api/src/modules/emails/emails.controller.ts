import { Request, Response, NextFunction } from 'express';
import { EmailsService } from './emails.service';
import { emailLimiter } from '../../middleware/rateLimiter';
import { prisma } from '../../config/prisma';

export class EmailsController {
  static getStatus(req: Request, res: Response) {
    res.status(200).json({
      success: true,
      data: {
        isConfigured: EmailsService.isConfigured()
      }
    });
  }

  static getTemplates(req: Request, res: Response) {
    res.status(200).json({
      success: true,
      data: EmailsService.getTemplates()
    });
  }

  static renderTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const { templateId, variables } = req.body;
      const result = EmailsService.renderTemplate(templateId, variables || {});
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async send(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await EmailsService.sendEmail(req.body, req.user!.id);
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async webhook(req: Request, res: Response, next: NextFunction) {
    try {
      // Support array of SendGrid events or single event payload
      const events = Array.isArray(req.body) ? req.body : [req.body];
      for (const ev of events) {
        if (ev && ev.email) {
          await EmailsService.handleWebhook(ev);
        }
      }
      res.status(200).json({ success: true, received: events.length });
    } catch (error) {
      next(error);
    }
  }

  static async listLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const contactId = req.query.contactId as string | undefined;
      const logs = await prisma.emailLog.findMany({
        where: contactId ? { contactId } : undefined,
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: { user: { select: { id: true, name: true } } }
      });
      res.status(200).json({
        success: true,
        data: logs
      });
    } catch (error) {
      next(error);
    }
  }
}
