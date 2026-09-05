import { Prisma, MeetingStatus, ActivityType, ActivityOutcome } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError } from '../../middleware/errorHandler';

export class MeetingsService {
  static async list(query: {
    userId?: string;
    contactId?: string;
    status?: MeetingStatus;
    startDate?: string;
    endDate?: string;
  }) {
    const where: Prisma.MeetingWhereInput = {};
    if (query.userId) where.userId = query.userId;
    if (query.contactId) where.contactId = query.contactId;
    if (query.status) where.status = query.status;

    if (query.startDate || query.endDate) {
      where.startTime = {};
      if (query.startDate) where.startTime.gte = new Date(query.startDate);
      if (query.endDate) where.startTime.lte = new Date(query.endDate);
    }

    return prisma.meeting.findMany({
      where,
      orderBy: { startTime: 'asc' },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        contact: { select: { id: true, fullName: true, email: true, phone: true } },
        company: { select: { id: true, name: true } },
        deal: { select: { id: true, name: true } }
      }
    });
  }

  static async create(data: any, userId: string) {
    const meeting = await prisma.meeting.create({
      data: {
        title: data.title.trim(),
        contactId: data.contactId || null,
        companyId: data.companyId || null,
        dealId: data.dealId || null,
        userId,
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        location: data.location || null,
        meetingLink: data.meetingLink || null,
        notes: data.notes || null,
        status: MeetingStatus.SCHEDULED
      },
      include: {
        contact: true,
        user: true
      }
    });

    // Auto-create Activity
    await prisma.activity.create({
      data: {
        type: ActivityType.MEETING_SCHEDULED,
        title: `Meeting Scheduled: ${meeting.title}`,
        description: `Time: ${new Date(meeting.startTime).toLocaleString('en-IN')}`,
        contactId: meeting.contactId,
        companyId: meeting.companyId,
        dealId: meeting.dealId,
        userId
      }
    });

    return meeting;
  }

  static async updateStatus(id: string, status: MeetingStatus, userId: string) {
    const existing = await prisma.meeting.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Meeting not found', 404, 'MEETING_NOT_FOUND');
    }

    const updated = await prisma.meeting.update({
      where: { id },
      data: { status }
    });

    if (status === MeetingStatus.COMPLETED) {
      await prisma.activity.create({
        data: {
          type: ActivityType.MEETING_COMPLETED,
          title: `Meeting Completed: ${existing.title}`,
          outcome: ActivityOutcome.POSITIVE,
          contactId: existing.contactId,
          companyId: existing.companyId,
          dealId: existing.dealId,
          userId
        }
      });
    }

    return updated;
  }

  static async update(id: string, data: any) {
    return prisma.meeting.update({
      where: { id },
      data: {
        ...data,
        startTime: data.startTime ? new Date(data.startTime) : undefined,
        endTime: data.endTime ? new Date(data.endTime) : undefined
      }
    });
  }

  static async delete(id: string) {
    await prisma.meeting.delete({ where: { id } });
    return { message: 'Meeting deleted successfully' };
  }
}
