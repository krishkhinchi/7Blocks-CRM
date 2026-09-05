import { Request, Response, NextFunction } from 'express';
import { TasksService } from './tasks.service';

export class TasksController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const tasks = await TasksService.list(req.query as any);
      res.status(200).json({
        success: true,
        data: tasks
      });
    } catch (error) {
      next(error);
    }
  }

  static async getCategorized(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req.query.assignedToId as string) || (req.user!.role === 'SALES_REP' ? req.user!.id : undefined);
      const categorized = await TasksService.getCategorizedTasks(userId);
      res.status(200).json({
        success: true,
        data: categorized
      });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const task = await TasksService.create(req.body, req.user!.id);
      res.status(201).json({
        success: true,
        data: task
      });
    } catch (error) {
      next(error);
    }
  }

  static async toggle(req: Request, res: Response, next: NextFunction) {
    try {
      const task = await TasksService.toggleStatus(req.params.id, req.user!.id);
      res.status(200).json({
        success: true,
        data: task
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const task = await TasksService.update(req.params.id, req.body, req.user!.id);
      res.status(200).json({
        success: true,
        data: task
      });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await TasksService.delete(req.params.id, req.user!.id);
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}
