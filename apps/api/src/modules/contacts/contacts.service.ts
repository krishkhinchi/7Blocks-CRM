import { Prisma, LeadStatus, LifecycleStage, LeadSource, ServiceInterest, AuditAction, ActivityType, ActivityOutcome } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError } from '../../middleware/errorHandler';
import { normalizePhone, normalizeEmail, calculateLeadScore } from '../../utils/normalizer';

export interface ListContactsQuery {
  page?: number;
  limit?: number;
  search?: string;
  leadStatus?: LeadStatus;
  lifecycleStage?: LifecycleStage;
  ownerId?: string;
  companyId?: string;
  serviceInterest?: ServiceInterest;
  leadSource?: LeadSource;
  tagId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class ContactsService {
  static async list(query: ListContactsQuery, currentUser: { id: string; role: string }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 25));
    const skip = (page - 1) * limit;

    const where: Prisma.ContactWhereInput = {
      deletedAt: null
    };

    // Role scoping: SALES_REP only sees assigned contacts unless search or permissions allow
    if (currentUser.role === 'SALES_REP') {
      where.ownerId = currentUser.id;
    } else if (query.ownerId) {
      where.ownerId = query.ownerId;
    }

    if (query.search) {
      const s = query.search.trim();
      where.OR = [
        { fullName: { contains: s, mode: 'insensitive' } },
        { email: { contains: s, mode: 'insensitive' } },
        { phone: { contains: s } },
        { company: { name: { contains: s, mode: 'insensitive' } } }
      ];
    }

    if (query.leadStatus) where.leadStatus = query.leadStatus;
    if (query.lifecycleStage) where.lifecycleStage = query.lifecycleStage;
    if (query.companyId) where.companyId = query.companyId;
    if (query.serviceInterest) where.serviceInterest = query.serviceInterest;
    if (query.leadSource) where.leadSource = query.leadSource;

    if (query.tagId) {
      where.tags = {
        some: { tagId: query.tagId }
      };
    }

    const orderBy: Prisma.ContactOrderByWithRelationInput = {};
    const sortField = query.sortBy || 'createdAt';
    const sortDir = query.sortOrder === 'asc' ? 'asc' : 'desc';

    if (['fullName', 'createdAt', 'updatedAt', 'lastContactedAt', 'leadScore'].includes(sortField)) {
      orderBy[sortField as keyof Prisma.ContactOrderByWithRelationInput] = sortDir as any;
    } else {
      orderBy.createdAt = 'desc';
    }

    const [total, contacts] = await Promise.all([
      prisma.contact.count({ where }),
      prisma.contact.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          company: {
            select: { id: true, name: true, domain: true, city: true }
          },
          owner: {
            select: { id: true, name: true, email: true, avatar: true }
          },
          tags: {
            include: { tag: true }
          },
          deals: {
            where: { deletedAt: null },
            select: { id: true, name: true, value: true, stage: true }
          },
          tasks: {
            where: { status: 'TODO' },
            select: { id: true, title: true, dueDate: true, priority: true },
            take: 1,
            orderBy: { dueDate: 'asc' }
          }
        }
      })
    ]);

    return {
      contacts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  static async getById(id: string) {
    const contact = await prisma.contact.findFirst({
      where: { id, deletedAt: null },
      include: {
        company: {
          include: {
            contacts: {
              where: { id: { not: id }, deletedAt: null },
              select: { id: true, fullName: true, jobTitle: true, phone: true, email: true }
            }
          }
        },
        owner: {
          select: { id: true, name: true, email: true, role: true, avatar: true }
        },
        tags: {
          include: { tag: true }
        },
        deals: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          include: { owner: { select: { id: true, name: true } } }
        },
        tasks: {
          orderBy: { dueDate: 'asc' },
          include: { assignedTo: { select: { id: true, name: true } } }
        },
        meetings: {
          orderBy: { startTime: 'desc' },
          take: 5
        },
        activities: {
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { id: true, name: true, avatar: true } }
          }
        }
      }
    });

    if (!contact) {
      throw new AppError('Contact not found', 404, 'CONTACT_NOT_FOUND');
    }

    // Dynamic Lead Score Calculation
    const daysSinceLastContact = contact.lastContactedAt
      ? Math.floor((Date.now() - new Date(contact.lastContactedAt).getTime()) / 86400000)
      : undefined;

    const scoring = calculateLeadScore({
      hasEmail: Boolean(contact.email),
      hasPhone: Boolean(contact.phone),
      hasWebsiteNeed: Boolean(contact.serviceInterest),
      hasPositiveOutcome: contact.activities.some(a => a.outcome === ActivityOutcome.INTERESTED || a.outcome === ActivityOutcome.POSITIVE),
      hasDemo: contact.activities.some(a => a.type === ActivityType.DEMO_SENT || a.outcome === ActivityOutcome.DEMO_REQUESTED),
      hasMeeting: contact.meetings.length > 0 || contact.activities.some(a => a.type === ActivityType.MEETING_SCHEDULED),
      daysSinceLastContact
    });

    return {
      ...contact,
      computedScore: scoring.score,
      scoreBreakdown: scoring.factors
    };
  }

  static async create(data: any, userId: string) {
    const email = normalizeEmail(data.email);
    const phone = normalizePhone(data.phone);
    const firstName = data.firstName?.trim() || data.fullName?.split(' ')[0] || 'Unknown';
    const lastName = data.lastName?.trim() || (data.fullName ? data.fullName.split(' ').slice(1).join(' ') : null);
    const fullName = data.fullName?.trim() || `${firstName} ${lastName || ''}`.trim();

    const contact = await prisma.contact.create({
      data: {
        firstName,
        lastName,
        fullName,
        email,
        secondaryEmail: normalizeEmail(data.secondaryEmail),
        phone,
        secondaryPhone: normalizePhone(data.secondaryPhone),
        companyId: data.companyId || null,
        jobTitle: data.jobTitle || null,
        linkedinUrl: data.linkedinUrl || null,
        industry: data.industry || null,
        companySize: data.companySize || null,
        location: data.location || null,
        leadSource: data.leadSource || LeadSource.COLD_OUTREACH,
        lifecycleStage: data.lifecycleStage || LifecycleStage.LEAD,
        leadStatus: data.leadStatus || LeadStatus.NEW,
        leadScore: data.leadScore || 15,
        serviceInterest: data.serviceInterest || null,
        ownerId: data.ownerId || userId,
        website: data.website || null,
        description: data.description || null,
        nextFollowUpAt: data.nextFollowUpAt ? new Date(data.nextFollowUpAt) : null,
      },
      include: {
        company: true,
        owner: true
      }
    });

    // Tag associations if provided
    if (Array.isArray(data.tagIds) && data.tagIds.length > 0) {
      await prisma.contactTag.createMany({
        data: data.tagIds.map((tagId: string) => ({ contactId: contact.id, tagId }))
      });
    }

    // Audit Log
    await prisma.auditLog.create({
      data: {
        userId,
        action: AuditAction.CONTACT_CREATED,
        entityType: 'Contact',
        entityId: contact.id,
        newValues: { fullName: contact.fullName, email: contact.email, phone: contact.phone }
      }
    });

    return contact;
  }

  static async update(id: string, data: any, userId: string) {
    const existing = await prisma.contact.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Contact not found', 404, 'CONTACT_NOT_FOUND');
    }

    const updateData: Prisma.ContactUpdateInput = { ...data };

    if (data.email !== undefined) updateData.email = normalizeEmail(data.email);
    if (data.phone !== undefined) updateData.phone = normalizePhone(data.phone);
    if (data.firstName || data.lastName) {
      const fName = data.firstName ?? existing.firstName;
      const lName = data.lastName ?? existing.lastName;
      updateData.fullName = `${fName} ${lName || ''}`.trim();
    }

    const updated = await prisma.contact.update({
      where: { id },
      data: updateData,
      include: { company: true, owner: true, tags: { include: { tag: true } } }
    });

    // Record Status Change Activity if status changed
    if (data.leadStatus && data.leadStatus !== existing.leadStatus) {
      await prisma.activity.create({
        data: {
          type: ActivityType.STATUS_CHANGE,
          title: `Status Changed: ${existing.leadStatus} → ${data.leadStatus}`,
          description: `Lead status updated by user.`,
          contactId: id,
          companyId: updated.companyId,
          userId,
          metadata: { oldStatus: existing.leadStatus, newStatus: data.leadStatus }
        }
      });
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId,
        action: AuditAction.CONTACT_UPDATED,
        entityType: 'Contact',
        entityId: id,
        oldValues: { leadStatus: existing.leadStatus, ownerId: existing.ownerId },
        newValues: { leadStatus: updated.leadStatus, ownerId: updated.ownerId }
      }
    });

    return updated;
  }

  static async delete(id: string, userId: string) {
    const existing = await prisma.contact.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Contact not found', 404, 'CONTACT_NOT_FOUND');
    }

    await prisma.contact.update({
      where: { id },
      data: { deletedAt: new Date() }
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: AuditAction.CONTACT_DELETED,
        entityType: 'Contact',
        entityId: id,
        oldValues: { fullName: existing.fullName }
      }
    });

    return { message: 'Contact deleted successfully' };
  }

  static async bulkUpdate(data: {
    contactIds: string[];
    leadStatus?: LeadStatus;
    ownerId?: string;
    addTagId?: string;
    delete?: boolean;
  }, userId: string) {
    const { contactIds, leadStatus, ownerId, addTagId } = data;

    if (data.delete) {
      await prisma.contact.updateMany({
        where: { id: { in: contactIds } },
        data: { deletedAt: new Date() }
      });
      return { count: contactIds.length, message: 'Contacts deleted successfully' };
    }

    const updates: Prisma.ContactUncheckedUpdateManyInput = {};
    if (leadStatus) updates.leadStatus = leadStatus;
    if (ownerId) updates.ownerId = ownerId;

    if (Object.keys(updates).length > 0) {
      await prisma.contact.updateMany({
        where: { id: { in: contactIds } },
        data: updates
      });
    }

    if (addTagId) {
      for (const cId of contactIds) {
        await prisma.contactTag.upsert({
          where: { contactId_tagId: { contactId: cId, tagId: addTagId } },
          create: { contactId: cId, tagId: addTagId },
          update: {}
        });
      }
    }

    return { count: contactIds.length, message: 'Bulk action completed' };
  }

  static async checkDuplicates(email?: string, phone?: string, fullName?: string) {
    const conditions: Prisma.ContactWhereInput[] = [];
    const normEmail = normalizeEmail(email);
    const normPhone = normalizePhone(phone);

    if (normEmail) conditions.push({ email: normEmail });
    if (normPhone) conditions.push({ phone: normPhone });
    if (fullName) conditions.push({ fullName: { contains: fullName.trim(), mode: 'insensitive' } });

    if (conditions.length === 0) return [];

    return prisma.contact.findMany({
      where: {
        deletedAt: null,
        OR: conditions
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        company: { select: { name: true } },
        leadStatus: true,
        createdAt: true
      },
      take: 5
    });
  }
}
