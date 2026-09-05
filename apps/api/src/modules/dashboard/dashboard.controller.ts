import { Request, Response, NextFunction } from 'express';
import { DashboardService } from './dashboard.service';

export class DashboardController {
  static async getOverview(req: Request, res: Response, next: NextFunction) {
    try {
      const timeframe = (req.query.timeframe as any) || '30days';
      const userId = req.user!.role === 'SALES_REP' ? req.user!.id : (req.query.userId as string | undefined);
      const data = await DashboardService.getOverview(timeframe, userId);
      res.status(200).json({
        success: true,
        data
      });
    } catch (error) {
      next(error);
    }
  }
}
