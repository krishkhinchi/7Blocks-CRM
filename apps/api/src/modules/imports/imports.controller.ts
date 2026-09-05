import { Request, Response, NextFunction } from 'express';
import { ImportsService } from './imports.service';
import { prisma } from '../../config/prisma';
import { AppError } from '../../middleware/errorHandler';

export class ImportsController {
  static async preview(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw new AppError('No file uploaded. Please select an Excel or CSV file.', 400, 'FILE_REQUIRED');
      }

      const preview = ImportsService.parseFile(req.file.buffer);
      res.status(200).json({
        success: true,
        data: preview
      });
    } catch (error) {
      next(error);
    }
  }

  static async execute(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw new AppError('No file uploaded.', 400, 'FILE_REQUIRED');
      }

      const mapping = JSON.parse(req.body.mapping || '{}');
      const duplicateHandling = req.body.duplicateHandling || 'skip';

      const result = await ImportsService.executeImport({
        buffer: req.file.buffer,
        filename: req.file.originalname,
        mapping,
        duplicateHandling,
        userId: req.user!.id
      });

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async listBatches(req: Request, res: Response, next: NextFunction) {
    try {
      const batches = await prisma.importBatch.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: { uploadedBy: { select: { id: true, name: true, email: true } } }
      });
      res.status(200).json({
        success: true,
        data: batches
      });
    } catch (error) {
      next(error);
    }
  }
}
