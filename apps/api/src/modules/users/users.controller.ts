import { Request, Response, NextFunction } from 'express';
import { UsersService } from './users.service';
import { UserRole } from '@prisma/client';
import { AppError } from '../../middleware/errorHandler';

export class UsersController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const role = req.query.role as UserRole | undefined;
      const includeInactive = req.user?.role === UserRole.ADMIN && req.query.includeInactive === 'true';
      const users = await UsersService.listUsers(role, includeInactive);
      res.status(200).json({
        success: true,
        data: users
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await UsersService.getUserById(req.params.id);
      res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await UsersService.updateProfile(req.user!.id, req.body);
      res.status(200).json({
        success: true,
        data: updated
      });
    } catch (error) {
      next(error);
    }
  }

  static async uploadAvatar(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw new AppError('No image file provided', 400, 'FILE_MISSING');
      }

      const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedMimes.includes(req.file.mimetype)) {
        throw new AppError('Invalid image format. Allowed formats: JPEG, PNG, WebP, GIF', 400, 'INVALID_FILE_TYPE');
      }

      const updated = await UsersService.updateAvatar(req.user!.id, req.file.buffer, req.file.mimetype);
      res.status(200).json({
        success: true,
        data: updated
      });
    } catch (error) {
      next(error);
    }
  }

  static async adminUpdate(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await UsersService.adminUpdateUser(req.user!.id, req.params.id, req.body);
      res.status(200).json({
        success: true,
        data: updated
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateRole(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await UsersService.adminUpdateUser(req.user!.id, req.params.id, { role: req.body.role });
      res.status(200).json({
        success: true,
        data: updated
      });
    } catch (error) {
      next(error);
    }
  }
}
