import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { ENV } from '../../config/env';
import { AppError } from '../../middleware/errorHandler';

export class AuthService {
  static generateTokens(user: { id: string; email: string; role: UserRole; name: string }) {
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    };

    const accessToken = jwt.sign(payload, ENV.JWT_SECRET, {
      expiresIn: ENV.JWT_EXPIRES_IN as any
    });

    const refreshToken = jwt.sign({ id: user.id }, ENV.JWT_REFRESH_SECRET, {
      expiresIn: ENV.JWT_REFRESH_EXPIRES_IN as any
    });

    return { accessToken, refreshToken };
  }

  static async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (!user) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    if (!user.isActive) {
      throw new AppError('Account has been deactivated. Please contact your admin.', 403, 'ACCOUNT_DEACTIVATED');
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    const tokens = this.generateTokens(user);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      },
      ...tokens
    };
  }

  static async register(data: { name: string; email: string; password: string; role?: UserRole; avatar?: string }) {
    const existing = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase().trim() }
    });

    if (existing) {
      throw new AppError('User with this email already exists', 409, 'EMAIL_EXISTS');
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email.toLowerCase().trim(),
        passwordHash,
        role: data.role || UserRole.SALES_REP,
        avatar: data.avatar || null,
        isActive: true
      }
    });

    const tokens = this.generateTokens(user);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      },
      ...tokens
    };
  }

  static async refreshToken(token: string) {
    try {
      const decoded: any = jwt.verify(token, ENV.JWT_REFRESH_SECRET);
      const user = await prisma.user.findUnique({
        where: { id: decoded.id }
      });

      if (!user || !user.isActive) {
        throw new AppError('User no longer exists or is inactive', 401, 'UNAUTHORIZED');
      }

      return this.generateTokens(user);
    } catch {
      throw new AppError('Invalid or expired refresh token', 401, 'INVALID_REFRESH_TOKEN');
    }
  }

  static async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true
      }
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    return user;
  }
}
