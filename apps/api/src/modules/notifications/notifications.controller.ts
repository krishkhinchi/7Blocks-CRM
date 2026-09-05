import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma';

export class NotificationsController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const notifications = await prisma.notification.findMany({
        where: { userId: req.user!.id },
        orderBy: { createdAt: 'desc' },
        take: 30
      });

      const unreadCount = await prisma.notification.count({
        where: { userId: req.user!.id, isRead: false }
      });

      res.status(200).json({
        success: true,
        data: {
          notifications,
          unreadCount
        }
      });
    } catch (error) {
      next(error);
    }
  }

  static async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updated = await prisma.notification.update({
        where: { id },
        data: { isRead: true }
      });
      res.status(200).json({
        success: true,
        data: updated
      });
    } catch (error) {
      next(error);
    }
  }

  static async markAllAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      await prisma.notification.updateMany({
        where: { userId: req.user!.id, isRead: false },
        data: { isRead: true }
      });
      res.status(200).json({
        success: true,
        data: { message: 'All notifications marked as read' }
      });
    } catch (error) {
      next(error);
    }
  }
}
