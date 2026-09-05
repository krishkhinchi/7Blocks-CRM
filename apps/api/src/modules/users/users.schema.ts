import { z } from 'zod';
import { UserRole } from '@prisma/client';

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').optional(),
  email: z.string().trim().email('Valid email address is required').optional(),
  avatar: z.string().nullable().optional()
});

export const adminUpdateUserSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').optional(),
  email: z.string().trim().email('Valid email address is required').optional(),
  role: z.nativeEnum(UserRole).optional(),
  isActive: z.boolean().optional(),
  avatar: z.string().nullable().optional()
});

export const updateRoleSchema = z.object({
  role: z.nativeEnum(UserRole, {
    errorMap: () => ({ message: 'Valid role is required (ADMIN, MANAGER, or SALES_REP)' })
  })
});
