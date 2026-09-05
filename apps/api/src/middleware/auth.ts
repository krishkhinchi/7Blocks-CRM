import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';
import { ENV } from '../config/env';
import { prisma } from '../config/prisma';
import { AppError } from './errorHandler';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  name: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication required. Please provide a valid token.', 401, 'UNAUTHORIZED');
    }

    const token = authHeader.split(' ')[1];
    let decoded: any;
    try {
      decoded = jwt.verify(token, ENV.JWT_SECRET);
    } catch (jwtErr: any) {
      if (jwtErr.name === 'TokenExpiredError') {
        throw new AppError('Token has expired. Please refresh your session.', 401, 'TOKEN_EXPIRED');
      }
      throw new AppError('Invalid authentication token.', 401, 'INVALID_TOKEN');
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, role: true, name: true, isActive: true }
    });

    if (!user || !user.isActive) {
      throw new AppError('User account is inactive or no longer exists.', 401, 'ACCOUNT_INACTIVE');
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

export function authorize(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Unauthorized', 401, 'UNAUTHORIZED'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          `Permission denied. Required role: ${allowedRoles.join(' or ')}. Your role: ${req.user.role}`,
          403,
          'FORBIDDEN'
        )
      );
    }

    next();
  };
}
