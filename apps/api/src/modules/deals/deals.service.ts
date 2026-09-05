import { Prisma, DealStage, ActivityType, ActivityOutcome, LifecycleStage, AuditAction } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError } from '../../middleware/errorHandler';

const STAGE_PROBABILITIES: Record<DealStage, number> = {
  [DealStage.PROSPECTING]: 10,
  [DealStage.QUALIFICATION]: 30,
  [DealStage.PROPOSAL]: 60,
  [DealStage.NEGOTIATION]: 80,
  [DealStage.CLOSED_WON]: 100,
  [DealStage.CLOSED_LOST]: 0
};

export class DealsService {
  static async list(query: {
    stage?: DealStage;
    ownerId?: string;
    companyId?: string;
    contactId?: string;
    search?: string;
  }) {
    const where: Prisma.DealWhereInput = {
      deletedAt: null
    };

    if (query.stage) where.stage = query.stage;
    if (query.ownerId) where.ownerId = query.ownerId;
    if (query.companyId) where.companyId = query.companyId;
    if (query.contactId) where.contactId = query.contactId;

    if (query.search) {
      where.OR = [
        { name: { contains: query.search.trim(), mode: 'insensitive' } },
        { company: { name: { contains: query.search.trim(), mode: 'insensitive' } } },
        { contact: { fullName: { contains: query.search.trim(), mode: 'insensitive' } } }
      ];
    }

    return prisma.deal.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        contact: { select: { id: true, fullName: true, email: true, phone: true } },
        company: { select: { id: true, name: true, domain: true } },
        owner: { select: { id: true, name: true, avatar: true } },
        tags: { include: { tag: true } }
      }
    });
  }

  static async getKanban(ownerId?: string) {
    const where: Prisma.DealWhereInput = {
      deletedAt: null
    };
    if (ownerId) where.ownerId = ownerId;

    const deals = await prisma.deal.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        contact: { select: { id: true, fullName: true, email: true, phone: true } },
        company: { select: { id: true, name: true, domain: true } },
        owner: { select: { id: true, name: true, avatar: true } },
        tags: { include: { tag: true } },
        tasks: {
          where: { status: 'TODO' },
          select: { id: true, title: true, dueDate: true, priority: true },
          take: 1,
          orderBy: { dueDate: 'asc' }
        }
      }
    });

    const columns: Record<DealStage, { stage: DealStage; title: string; count: number; totalValue: number; weightedValue: number; deals: any[] }> = {
      [DealStage.PROSPECTING]: { stage: DealStage.PROSPECTING, title: 'Prospecting', count: 0, totalValue: 0, weightedValue: 0, deals: [] },
      [DealStage.QUALIFICATION]: { stage: DealStage.QUALIFICATION, title: 'Qualification', count: 0, totalValue: 0, weightedValue: 0, deals: [] },
      [DealStage.PROPOSAL]: { stage: DealStage.PROPOSAL, title: 'Proposal', count: 0, totalValue: 0, weightedValue: 0, deals: [] },
      [DealStage.NEGOTIATION]: { stage: DealStage.NEGOTIATION, title: 'Negotiation', count: 0, totalValue: 0, weightedValue: 0, deals: [] },
      [DealStage.CLOSED_WON]: { stage: DealStage.CLOSED_WON, title: 'Closed Won', count: 0, totalValue: 0, weightedValue: 0, deals: [] },
      [DealStage.CLOSED_LOST]: { stage: DealStage.CLOSED_LOST, title: 'Closed Lost', count: 0, totalValue: 0, weightedValue: 0, deals: [] }
    };

    for (const deal of deals) {
      const col = columns[deal.stage];
      if (col) {
        col.deals.push(deal);
        col.count += 1;
        col.totalValue += deal.value;
        col.weightedValue += (deal.value * deal.probability) / 100;
      }
    }

    return Object.values(columns);
  }

  static async getById(id: string) {
    const deal = await prisma.deal.findFirst({
      where: { id, deletedAt: null },
      include: {
        contact: {
          include: {
            owner: { select: { id: true, name: true } }
          }
        },
        company: true,
        owner: { select: { id: true, name: true, email: true, avatar: true } },
        tags: { include: { tag: true } },
        activities: {
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { id: true, name: true } } }
        },
        tasks: {
          orderBy: { dueDate: 'asc' },
          include: { assignedTo: { select: { id: true, name: true } } }
        }
      }
    });

    if (!deal) {
      throw new AppError('Deal not found', 404, 'DEAL_NOT_FOUND');
    }

    return deal;
  }

  static async create(data: any, userId: string) {
    const probability = data.probability ?? STAGE_PROBABILITIES[data.stage as DealStage] ?? 10;

    const deal = await prisma.deal.create({
      data: {
        name: data.name.trim(),
        value: Number(data.value) || 0,
        currency: data.currency || 'INR',
        stage: data.stage || DealStage.PROSPECTING,
        probability,
        expectedCloseDate: data.expectedCloseDate ? new Date(data.expectedCloseDate) : null,
        serviceType: data.serviceType || null,
        contactId: data.contactId || null,
        companyId: data.companyId || null,
        ownerId: data.ownerId || userId,
        description: data.description || null
      },
      include: {
        contact: true,
        company: true,
        owner: true
      }
    });

    // Auto-create DEAL_CREATED activity
    await prisma.activity.create({
      data: {
        type: ActivityType.DEAL_CREATED,
        title: `Deal Created: ${deal.name}`,
        description: `Value: ₹${deal.value.toLocaleString('en-IN')}, Stage: ${deal.stage}`,
        dealId: deal.id,
        contactId: deal.contactId,
        companyId: deal.companyId,
        userId
      }
    });

    // Audit Log
    await prisma.auditLog.create({
      data: {
        userId,
        action: AuditAction.DEAL_CREATED,
        entityType: 'Deal',
        entityId: deal.id,
        newValues: { name: deal.name, value: deal.value, stage: deal.stage }
      }
    });

    return deal;
  }

  static async update(id: string, data: any, userId: string) {
    const existing = await prisma.deal.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Deal not found', 404, 'DEAL_NOT_FOUND');
    }

    const updated = await prisma.deal.update({
      where: { id },
      data: {
        ...data,
        value: data.value !== undefined ? Number(data.value) : undefined,
        expectedCloseDate: data.expectedCloseDate ? new Date(data.expectedCloseDate) : undefined
      },
      include: { contact: true, company: true, owner: true }
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: AuditAction.DEAL_UPDATED,
        entityType: 'Deal',
        entityId: id,
        oldValues: { name: existing.name, value: existing.value },
        newValues: { name: updated.name, value: updated.value }
      }
    });

    return updated;
  }

  static async updateStage(id: string, stage: DealStage, lostReason?: string, userId?: string) {
    const existing = await prisma.deal.findUnique({
      where: { id },
      include: { contact: true }
    });

    if (!existing) {
      throw new AppError('Deal not found', 404, 'DEAL_NOT_FOUND');
    }

    const probability = STAGE_PROBABILITIES[stage];

    const updated = await prisma.deal.update({
      where: { id },
      data: {
        stage,
        probability,
        lostReason: stage === DealStage.CLOSED_LOST ? (lostReason || 'Not specified') : null
      },
      include: { contact: true, company: true, owner: true }
    });

    // Automatically create STATUS_CHANGE Activity
    if (userId) {
      await prisma.activity.create({
        data: {
          type: ActivityType.STATUS_CHANGE,
          title: `Deal Stage: ${existing.stage} → ${stage}`,
          description: stage === DealStage.CLOSED_LOST && lostReason ? `Lost Reason: ${lostReason}` : undefined,
          outcome: stage === DealStage.CLOSED_WON ? ActivityOutcome.POSITIVE : (stage === DealStage.CLOSED_LOST ? ActivityOutcome.NEGATIVE : ActivityOutcome.OTHER),
          dealId: id,
          contactId: existing.contactId,
          companyId: existing.companyId,
          userId,
          metadata: { oldStage: existing.stage, newStage: stage, probability }
        }
      });

      // If Closed Won -> Update Contact to CUSTOMER
      if (stage === DealStage.CLOSED_WON && existing.contactId) {
        await prisma.contact.update({
          where: { id: existing.contactId },
          data: { lifecycleStage: LifecycleStage.CUSTOMER }
        });
      }

      // Audit Log
      await prisma.auditLog.create({
        data: {
          userId,
          action: AuditAction.DEAL_STAGE_CHANGED,
          entityType: 'Deal',
          entityId: id,
          oldValues: { stage: existing.stage, probability: existing.probability },
          newValues: { stage, probability, lostReason }
        }
      });
    }

    return updated;
  }

  static async getAnalytics() {
    const deals = await prisma.deal.findMany({
      where: { deletedAt: null },
      select: { value: true, probability: true, stage: true }
    });

    const activeDeals = deals.filter(d => d.stage !== DealStage.CLOSED_WON && d.stage !== DealStage.CLOSED_LOST);
    const wonDeals = deals.filter(d => d.stage === DealStage.CLOSED_WON);
    const lostDeals = deals.filter(d => d.stage === DealStage.CLOSED_LOST);

    const totalPipelineValue = activeDeals.reduce((sum, d) => sum + d.value, 0);
    const weightedPipelineValue = activeDeals.reduce((sum, d) => sum + (d.value * d.probability) / 100, 0);
    const closedWonValue = wonDeals.reduce((sum, d) => sum + d.value, 0);
    const closedLostValue = lostDeals.reduce((sum, d) => sum + d.value, 0);

    const totalClosed = wonDeals.length + lostDeals.length;
    const winRate = totalClosed > 0 ? (wonDeals.length / totalClosed) * 100 : 0;
    const avgDealSize = wonDeals.length > 0 ? closedWonValue / wonDeals.length : (deals.length > 0 ? (totalPipelineValue + closedWonValue) / deals.length : 0);

    return {
      totalPipelineValue,
      weightedPipelineValue,
      closedWonValue,
      closedLostValue,
      winRate: Number(winRate.toFixed(1)),
      avgDealSize: Math.round(avgDealSize),
      activeCount: activeDeals.length,
      wonCount: wonDeals.length,
      lostCount: lostDeals.length
    };
  }
}
