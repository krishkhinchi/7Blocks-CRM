import { z } from 'zod';
import { UserRole } from '@prisma/client';

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Valid email address is required'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  email: z.string().trim().toLowerCase().email('Valid email address is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.nativeEnum(UserRole).default(UserRole.SALES_REP),
  avatar: z.string().url().optional()
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(10, 'Valid refresh token is required')
});
