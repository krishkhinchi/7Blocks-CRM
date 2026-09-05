import { Request, Response, NextFunction } from 'express';
import { MeetingsService } from './meetings.service';

export class MeetingsController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const meetings = await MeetingsService.list(req.query as any);
      res.status(200).json({
        success: true,
        data: meetings
      });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const meeting = await MeetingsService.create(req.body, req.user!.id);
      res.status(201).json({
        success: true,
        data: meeting
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const meeting = await MeetingsService.updateStatus(req.params.id, req.body.status, req.user!.id);
      res.status(200).json({
        success: true,
        data: meeting
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const meeting = await MeetingsService.update(req.params.id, req.body);
      res.status(200).json({
        success: true,
        data: meeting
      });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await MeetingsService.delete(req.params.id);
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}
