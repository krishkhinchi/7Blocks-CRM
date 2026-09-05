import { Request, Response, NextFunction } from 'express';
import { ContactsService } from './contacts.service';

export class ContactsController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ContactsService.list(req.query as any, {
        id: req.user!.id,
        role: req.user!.role
      });
      res.status(200).json({
        success: true,
        data: result.contacts,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const contact = await ContactsService.getById(req.params.id);
      res.status(200).json({
        success: true,
        data: contact
      });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const contact = await ContactsService.create(req.body, req.user!.id);
      res.status(201).json({
        success: true,
        data: contact
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const contact = await ContactsService.update(req.params.id, req.body, req.user!.id);
      res.status(200).json({
        success: true,
        data: contact
      });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ContactsService.delete(req.params.id, req.user!.id);
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async bulk(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ContactsService.bulkUpdate(req.body, req.user!.id);
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async checkDuplicates(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, phone, fullName } = req.query as { email?: string; phone?: string; fullName?: string };
      const duplicates = await ContactsService.checkDuplicates(email, phone, fullName);
      res.status(200).json({
        success: true,
        data: duplicates
      });
    } catch (error) {
      next(error);
    }
  }
}
