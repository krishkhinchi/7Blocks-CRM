import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma';

export class AuditController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 25));
      const skip = (page - 1) * limit;

      const entityType = req.query.entityType as string | undefined;
      const entityId = req.query.entityId as string | undefined;
      const userId = req.query.userId as string | undefined;

      const where: any = {};
      if (entityType) where.entityType = entityType;
      if (entityId) where.entityId = entityId;
      if (userId) where.userId = userId;

      const [total, logs] = await Promise.all([
        prisma.auditLog.count({ where }),
        prisma.auditLog.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { id: true, name: true, email: true, avatar: true, role: true } }
          }
        })
      ]);

      res.status(200).json({
        success: true,
        data: logs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      next(error);
    }
  }
}
