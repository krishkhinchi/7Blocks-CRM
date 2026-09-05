import { Prisma, ActivityType, ActivityOutcome, LeadStatus, TaskPriority, TaskStatus, AuditAction } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError } from '../../middleware/errorHandler';

export class ActivitiesService {
  static async list(query: {
    contactId?: string;
    companyId?: string;
    dealId?: string;
    userId?: string;
    type?: ActivityType;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 25));
    const skip = (page - 1) * limit;

    const where: Prisma.ActivityWhereInput = {};
    if (query.contactId) where.contactId = query.contactId;
    if (query.companyId) where.companyId = query.companyId;
    if (query.dealId) where.dealId = query.dealId;
    if (query.userId) where.userId = query.userId;
    if (query.type) where.type = query.type;

    const [total, activities] = await Promise.all([
      prisma.activity.count({ where }),
      prisma.activity.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, avatar: true } },
          contact: { select: { id: true, fullName: true, email: true, phone: true } },
          company: { select: { id: true, name: true } },
          deal: { select: { id: true, name: true, value: true } }
        }
      })
    ]);

    return {
      activities,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  static async logActivity(data: {
    type: ActivityType;
    title: string;
    description?: string;
    duration?: number;
    outcome?: ActivityOutcome;
    notes?: string;
    contactId?: string;
    companyId?: string;
    dealId?: string;
    metadata?: any;
  }, userId: string) {
    const activity = await prisma.activity.create({
      data: {
        type: data.type,
        title: data.title,
        description: data.description,
        duration: data.duration,
        outcome: data.outcome,
        notes: data.notes,
        contactId: data.contactId,
        companyId: data.companyId,
        dealId: data.dealId,
        userId,
        metadata: data.metadata || Prisma.JsonNull
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } }
      }
    });

    if (data.contactId) {
      await prisma.contact.update({
        where: { id: data.contactId },
        data: { lastContactedAt: new Date() }
      });
    }

    return activity;
  }

  static async logCall(data: {
    contactId: string;
    callType: 'COLD_CALL' | 'WARM_CALL';
    outcome: ActivityOutcome;
    durationSeconds?: number;
    notes?: string;
    followUpRequired?: boolean;
    followUpDate?: string;
    followUpTaskTitle?: string;
  }, userId: string) {
    const contact = await prisma.contact.findUnique({
      where: { id: data.contactId }
    });

    if (!contact) {
      throw new AppError('Contact not found', 404, 'CONTACT_NOT_FOUND');
    }

    // 1. Create Call Activity
    const activity = await prisma.activity.create({
      data: {
        type: data.callType === 'COLD_CALL' ? ActivityType.COLD_CALL : ActivityType.WARM_CALL,
        title: `${data.callType === 'COLD_CALL' ? 'Cold Call' : 'Follow-up Call'} with ${contact.fullName}`,
        duration: data.durationSeconds || 60,
        outcome: data.outcome,
        notes: data.notes,
        contactId: contact.id,
        companyId: contact.companyId,
        userId,
        metadata: {
          outcomeName: data.outcome,
          duration: data.durationSeconds
        }
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } }
      }
    });

    // 2. Update Contact state & lastContactedAt
    const contactUpdates: Prisma.ContactUpdateInput = {
      lastContactedAt: new Date()
    };

    if (contact.leadStatus === LeadStatus.NEW) {
      contactUpdates.leadStatus = LeadStatus.CONTACTED;
    }

    if (data.outcome === ActivityOutcome.INTERESTED || data.outcome === ActivityOutcome.POSITIVE) {
      contactUpdates.leadStatus = LeadStatus.INTERESTED;
      contactUpdates.leadScore = Math.min(100, contact.leadScore + 20);
    } else if (data.outcome === ActivityOutcome.CALLBACK_REQUESTED) {
      contactUpdates.leadStatus = LeadStatus.CALLBACK_SCHEDULED;
    } else if (data.outcome === ActivityOutcome.DEMO_REQUESTED) {
      contactUpdates.leadStatus = LeadStatus.DEMO_SCHEDULED;
      contactUpdates.leadScore = Math.min(100, contact.leadScore + 25);
    } else if (data.outcome === ActivityOutcome.MEETING_REQUESTED) {
      contactUpdates.leadStatus = LeadStatus.MEETING_SCHEDULED;
      contactUpdates.leadScore = Math.min(100, contact.leadScore + 30);
    } else if (data.outcome === ActivityOutcome.DO_NOT_CONTACT) {
      contactUpdates.leadStatus = LeadStatus.DO_NOT_CONTACT;
    }

    if (data.followUpDate) {
      contactUpdates.nextFollowUpAt = new Date(data.followUpDate);
    }

    await prisma.contact.update({
      where: { id: contact.id },
      data: contactUpdates
    });

    // 3. Create Follow-Up Task if required
    let followUpTask = null;
    if (data.followUpRequired && data.followUpDate) {
      followUpTask = await prisma.task.create({
        data: {
          title: data.followUpTaskTitle || `Call back ${contact.fullName}`,
          description: data.notes ? `Call context: ${data.notes}` : `Follow up required after call outcome: ${data.outcome}`,
          dueDate: new Date(data.followUpDate),
          priority: TaskPriority.HIGH,
          status: TaskStatus.TODO,
          assignedToId: userId,
          contactId: contact.id,
          companyId: contact.companyId
        }
      });
    }

    // 4. Audit Log
    await prisma.auditLog.create({
      data: {
        userId,
        action: AuditAction.ACTIVITY_LOGGED,
        entityType: 'Contact',
        entityId: contact.id,
        newValues: {
          activityType: activity.type,
          outcome: data.outcome,
          taskId: followUpTask?.id
        }
      }
    });

    return {
      activity,
      followUpTask,
      message: 'Call logged successfully'
    };
  }
}
