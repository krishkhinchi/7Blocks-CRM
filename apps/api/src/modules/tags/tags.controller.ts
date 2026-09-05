import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma';

export class TagsController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const tags = await prisma.tag.findMany({
        orderBy: { name: 'asc' },
        include: {
          _count: { select: { contactTags: true, companyTags: true, dealTags: true } }
        }
      });
      res.status(200).json({
        success: true,
        data: tags
      });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, color } = req.body;
      const tag = await prisma.tag.create({
        data: {
          name: name.trim(),
          color: color || '#4f46e5'
        }
      });
      res.status(201).json({
        success: true,
        data: tag
      });
    } catch (error) {
      next(error);
    }
  }
}
