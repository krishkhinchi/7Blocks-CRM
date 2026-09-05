import { Prisma, TaskStatus, TaskPriority, ActivityType, AuditAction } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError } from '../../middleware/errorHandler';

export class TasksService {
  static async list(query: {
    assignedToId?: string;
    contactId?: string;
    companyId?: string;
    dealId?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
  }) {
    const where: Prisma.TaskWhereInput = {};
    if (query.assignedToId) where.assignedToId = query.assignedToId;
    if (query.contactId) where.contactId = query.contactId;
    if (query.companyId) where.companyId = query.companyId;
    if (query.dealId) where.dealId = query.dealId;
    if (query.status) where.status = query.status;
    if (query.priority) where.priority = query.priority;

    return prisma.task.findMany({
      where,
      orderBy: { dueDate: 'asc' },
      include: {
        assignedTo: { select: { id: true, name: true, avatar: true } },
        contact: { select: { id: true, fullName: true, phone: true, email: true } },
        company: { select: { id: true, name: true } },
        deal: { select: { id: true, name: true } }
      }
    });
  }

  static async getCategorizedTasks(userId?: string) {
    const where: Prisma.TaskWhereInput = {};
    if (userId) where.assignedToId = userId;

    const allTasks = await prisma.task.findMany({
      where,
      orderBy: { dueDate: 'asc' },
      include: {
        assignedTo: { select: { id: true, name: true, avatar: true } },
        contact: { select: { id: true, fullName: true, phone: true } },
        company: { select: { id: true, name: true } }
      }
    });

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const endOfTomorrow = new Date(startOfToday.getTime() + 2 * 86400000);
    const endOfWeek = new Date(startOfToday.getTime() + 7 * 86400000);

    const overdue: any[] = [];
    const today: any[] = [];
    const tomorrow: any[] = [];
    const thisWeek: any[] = [];
    const upcoming: any[] = [];
    const completed: any[] = [];

    for (const t of allTasks) {
      if (t.status === TaskStatus.COMPLETED) {
        completed.push(t);
        continue;
      }

      const due = new Date(t.dueDate);
      if (due < startOfToday) {
        overdue.push(t);
      } else if (due <= endOfToday) {
        today.push(t);
      } else if (due <= endOfTomorrow) {
        tomorrow.push(t);
      } else if (due <= endOfWeek) {
        thisWeek.push(t);
      } else {
        upcoming.push(t);
      }
    }

    return {
      overdue,
      today,
      tomorrow,
      thisWeek,
      upcoming,
      completed,
      stats: {
        overdueCount: overdue.length,
        todayCount: today.length,
        totalPending: overdue.length + today.length + tomorrow.length + thisWeek.length + upcoming.length,
        completedCount: completed.length
      }
    };
  }

  static async create(data: any, userId: string) {
    const task = await prisma.task.create({
      data: {
        title: data.title.trim(),
        description: data.description || null,
        dueDate: new Date(data.dueDate),
        priority: data.priority || TaskPriority.MEDIUM,
        status: TaskStatus.TODO,
        assignedToId: data.assignedToId || userId,
        contactId: data.contactId || null,
        companyId: data.companyId || null,
        dealId: data.dealId || null,
        reminderAt: data.reminderAt ? new Date(data.reminderAt) : null
      },
      include: {
        assignedTo: { select: { id: true, name: true, avatar: true } },
        contact: { select: { id: true, fullName: true } }
      }
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: AuditAction.TASK_CREATED,
        entityType: 'Task',
        entityId: task.id,
        newValues: { title: task.title, dueDate: task.dueDate }
      }
    });

    return task;
  }

  static async toggleStatus(id: string, userId: string) {
    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Task not found', 404, 'TASK_NOT_FOUND');
    }

    const newStatus = existing.status === TaskStatus.COMPLETED ? TaskStatus.TODO : TaskStatus.COMPLETED;
    const completedAt = newStatus === TaskStatus.COMPLETED ? new Date() : null;

    const updated = await prisma.task.update({
      where: { id },
      data: { status: newStatus, completedAt },
      include: { contact: true }
    });

    if (newStatus === TaskStatus.COMPLETED) {
      await prisma.activity.create({
        data: {
          type: ActivityType.TASK_COMPLETED,
          title: `Completed Task: ${existing.title}`,
          description: existing.description || undefined,
          contactId: existing.contactId,
          companyId: existing.companyId,
          dealId: existing.dealId,
          userId
        }
      });
    }

    return updated;
  }

  static async update(id: string, data: any, userId: string) {
    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Task not found', 404, 'TASK_NOT_FOUND');
    }

    return prisma.task.update({
      where: { id },
      data: {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        reminderAt: data.reminderAt ? new Date(data.reminderAt) : undefined
      },
      include: { assignedTo: true, contact: true }
    });
  }

  static async delete(id: string, userId: string) {
    await prisma.task.delete({ where: { id } });
    return { message: 'Task deleted successfully' };
  }
}
