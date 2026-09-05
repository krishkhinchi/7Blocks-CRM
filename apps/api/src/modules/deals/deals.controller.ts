import { Request, Response, NextFunction } from 'express';
import { DealsService } from './deals.service';

export class DealsController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const deals = await DealsService.list(req.query as any);
      res.status(200).json({
        success: true,
        data: deals
      });
    } catch (error) {
      next(error);
    }
  }

  static async getKanban(req: Request, res: Response, next: NextFunction) {
    try {
      const ownerId = req.query.ownerId as string | undefined;
      const columns = await DealsService.getKanban(ownerId);
      res.status(200).json({
        success: true,
        data: columns
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const analytics = await DealsService.getAnalytics();
      res.status(200).json({
        success: true,
        data: analytics
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const deal = await DealsService.getById(req.params.id);
      res.status(200).json({
        success: true,
        data: deal
      });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const deal = await DealsService.create(req.body, req.user!.id);
      res.status(201).json({
        success: true,
        data: deal
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const deal = await DealsService.update(req.params.id, req.body, req.user!.id);
      res.status(200).json({
        success: true,
        data: deal
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateStage(req: Request, res: Response, next: NextFunction) {
    try {
      const { stage, lostReason } = req.body;
      const deal = await DealsService.updateStage(req.params.id, stage, lostReason, req.user!.id);
      res.status(200).json({
        success: true,
        data: deal
      });
    } catch (error) {
      next(error);
    }
  }
}
