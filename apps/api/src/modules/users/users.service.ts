import { UserRole, AuditAction } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError } from '../../middleware/errorHandler';

export class UsersService {
  static async listUsers(role?: UserRole, includeInactive = false) {
    return prisma.user.findMany({
      where: {
        ...(role ? { role } : {}),
        ...(includeInactive ? {} : { isActive: true })
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        _count: {
          select: {
            contacts: true,
            deals: true,
            tasks: { where: { status: 'TODO' } }
          }
        }
      },
      orderBy: { name: 'asc' }
    });
  }

  static async getUserById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
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

  static async updateProfile(userId: string, data: { name?: string; email?: string; avatar?: string | null }) {
    if (data.email) {
      const email = data.email.toLowerCase().trim();
      const existing = await prisma.user.findFirst({
        where: { email, NOT: { id: userId } }
      });
      if (existing) {
        throw new AppError('An account with this email already exists', 400, 'EMAIL_ALREADY_EXISTS');
      }
      data.email = email;
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.name !== undefined ? { name: data.name.trim() } : {}),
        ...(data.email !== undefined ? { email: data.email } : {}),
        ...(data.avatar !== undefined ? { avatar: data.avatar } : {})
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        isActive: true,
        updatedAt: true
      }
    });

    // Record audit log
    await prisma.auditLog.create({
      data: {
        userId,
        action: AuditAction.USER_UPDATED,
        entityType: 'User',
        entityId: userId,
        newValues: { name: updated.name, email: updated.email, avatar: updated.avatar }
      }
    }).catch(() => {});

    return updated;
  }

  static async adminUpdateUser(
    adminId: string,
    targetId: string,
    data: { name?: string; email?: string; role?: UserRole; isActive?: boolean; avatar?: string | null }
  ) {
    const target = await prisma.user.findUnique({ where: { id: targetId } });
    if (!target) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    // Protection rule: Cannot demote or deactivate the last active administrator
    const isDemotingAdmin = target.role === UserRole.ADMIN && data.role !== undefined && data.role !== UserRole.ADMIN;
    const isDeactivatingAdmin = target.role === UserRole.ADMIN && target.isActive && data.isActive === false;

    if (isDemotingAdmin || isDeactivatingAdmin) {
      const activeAdminCount = await prisma.user.count({
        where: { role: UserRole.ADMIN, isActive: true }
      });
      if (activeAdminCount <= 1) {
        throw new AppError('Cannot demote or deactivate the last active administrator', 400, 'LAST_ADMIN_PROTECTED');
      }
    }

    // Check duplicate email
    if (data.email) {
      const email = data.email.toLowerCase().trim();
      const existing = await prisma.user.findFirst({
        where: { email, NOT: { id: targetId } }
      });
      if (existing) {
        throw new AppError('An account with this email already exists', 400, 'EMAIL_ALREADY_EXISTS');
      }
      data.email = email;
    }

    const updated = await prisma.user.update({
      where: { id: targetId },
      data: {
        ...(data.name !== undefined ? { name: data.name.trim() } : {}),
        ...(data.email !== undefined ? { email: data.email } : {}),
        ...(data.role !== undefined ? { role: data.role } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
        ...(data.avatar !== undefined ? { avatar: data.avatar } : {})
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        isActive: true,
        updatedAt: true
      }
    });

    // Record audit log
    await prisma.auditLog.create({
      data: {
        userId: adminId,
        action: AuditAction.USER_UPDATED,
        entityType: 'User',
        entityId: targetId,
        oldValues: { name: target.name, email: target.email, role: target.role, isActive: target.isActive },
        newValues: { name: updated.name, email: updated.email, role: updated.role, isActive: updated.isActive }
      }
    }).catch(() => {});

    return updated;
  }

  static async updateAvatar(userId: string, buffer: Buffer, mimetype: string) {
    const dataUri = `data:${mimetype};base64,${buffer.toString('base64')}`;
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { avatar: dataUri },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        isActive: true,
        updatedAt: true
      }
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: AuditAction.USER_UPDATED,
        entityType: 'User',
        entityId: userId,
        newValues: { avatar: 'DATA_URI_IMAGE' }
      }
    }).catch(() => {});

    return updated;
  }
}
