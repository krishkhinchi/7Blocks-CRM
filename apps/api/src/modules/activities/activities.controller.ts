import { Request, Response, NextFunction } from 'express';
import { ActivitiesService } from './activities.service';

export class ActivitiesController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ActivitiesService.list(req.query as any);
      res.status(200).json({
        success: true,
        data: result.activities,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }

  static async logActivity(req: Request, res: Response, next: NextFunction) {
    try {
      const activity = await ActivitiesService.logActivity(req.body, req.user!.id);
      res.status(201).json({
        success: true,
        data: activity
      });
    } catch (error) {
      next(error);
    }
  }

  static async logCall(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ActivitiesService.logCall(req.body, req.user!.id);
      res.status(201).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}
