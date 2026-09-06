import { Request, Response, NextFunction } from 'express';
import { CompaniesService } from './companies.service';

export class CompaniesController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await CompaniesService.list(req.query as any);
      res.status(200).json({
        success: true,
        data: result.companies,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const company = await CompaniesService.getById(req.params.id);
      res.status(200).json({
        success: true,
        data: company
      });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const company = await CompaniesService.create(req.body, req.user!.id);
      res.status(201).json({
        success: true,
        data: company
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const company = await CompaniesService.update(req.params.id, req.body, req.user!.id);
      res.status(200).json({
        success: true,
        data: company
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await CompaniesService.deleteAll(req.user!.id);
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await CompaniesService.delete(req.params.id, req.user!.id);
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}
