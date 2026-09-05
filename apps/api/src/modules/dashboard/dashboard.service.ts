import { DealStage, ActivityType, LeadStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';

export class DashboardService {
  static async getOverview(timeframe: 'today' | '7days' | '30days' | '90days' | 'all' = '30days', userId?: string) {
    const now = new Date();
    let startDate: Date | undefined;

    if (timeframe === 'today') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (timeframe === '7days') {
      startDate = new Date(Date.now() - 7 * 86400000);
    } else if (timeframe === '30days') {
      startDate = new Date(Date.now() - 30 * 86400000);
    } else if (timeframe === '90days') {
      startDate = new Date(Date.now() - 90 * 86400000);
    }

    const activityFilter: any = startDate ? { createdAt: { gte: startDate } } : {};
    if (userId) activityFilter.userId = userId;

    const contactFilter: any = { deletedAt: null };
    if (userId) contactFilter.ownerId = userId;
    if (startDate) contactFilter.createdAt = { gte: startDate };

    const dealFilter: any = { deletedAt: null };
    if (userId) dealFilter.ownerId = userId;

    // Execute parallel aggregations
    const [
      totalContacts,
      newContactsInPeriod,
      emailsCount,
      callsCount,
      deals,
      recentActivities,
      pendingTasks,
      salesReps
    ] = await Promise.all([
      prisma.contact.count({ where: { deletedAt: null, ...(userId ? { ownerId: userId } : {}) } }),
      prisma.contact.count({ where: contactFilter }),
      prisma.activity.count({
        where: {
          ...activityFilter,
          type: { in: [ActivityType.EMAIL_SENT, ActivityType.EMAIL_REPLIED] }
        }
      }),
      prisma.activity.count({
        where: {
          ...activityFilter,
          type: { in: [ActivityType.COLD_CALL, ActivityType.WARM_CALL] }
        }
      }),
      prisma.deal.findMany({
        where: dealFilter,
        select: { id: true, value: true, stage: true, probability: true, serviceType: true }
      }),
      prisma.activity.findMany({
        where: userId ? { userId } : {},
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, avatar: true } },
          contact: { select: { id: true, fullName: true } }
        }
      }),
      prisma.task.findMany({
        where: {
          status: 'TODO',
          ...(userId ? { assignedToId: userId } : {})
        },
        take: 5,
        orderBy: { dueDate: 'asc' },
        include: {
          contact: { select: { id: true, fullName: true, phone: true } },
          assignedTo: { select: { id: true, name: true } }
        }
      }),
      prisma.user.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          role: true,
          deals: {
            where: { deletedAt: null },
            select: { value: true, stage: true }
          },
          activities: {
            where: startDate ? { createdAt: { gte: startDate } } : {},
            select: { type: true }
          },
          _count: {
            select: { contacts: true }
          }
        }
      })
    ]);

    // Compute Pipeline metrics
    const activeDeals = deals.filter(d => d.stage !== DealStage.CLOSED_WON && d.stage !== DealStage.CLOSED_LOST);
    const wonDeals = deals.filter(d => d.stage === DealStage.CLOSED_WON);
    const lostDeals = deals.filter(d => d.stage === DealStage.CLOSED_LOST);

    const totalPipelineValue = activeDeals.reduce((acc, d) => acc + d.value, 0);
    const weightedPipelineValue = activeDeals.reduce((acc, d) => acc + (d.value * d.probability) / 100, 0);
    const closedWonRevenue = wonDeals.reduce((acc, d) => acc + d.value, 0);
    const totalClosed = wonDeals.length + lostDeals.length;
    const conversionRate = totalClosed > 0 ? (wonDeals.length / totalClosed) * 100 : (deals.length > 0 ? (wonDeals.length / deals.length) * 100 : 0);

    // Deals by Stage breakdown
    const stageCounts: Record<string, { count: number; totalValue: number }> = {
      PROSPECTING: { count: 0, totalValue: 0 },
      QUALIFICATION: { count: 0, totalValue: 0 },
      PROPOSAL: { count: 0, totalValue: 0 },
      NEGOTIATION: { count: 0, totalValue: 0 },
      CLOSED_WON: { count: 0, totalValue: 0 },
      CLOSED_LOST: { count: 0, totalValue: 0 }
    };

    for (const d of deals) {
      if (stageCounts[d.stage]) {
        stageCounts[d.stage].count += 1;
        stageCounts[d.stage].totalValue += d.value;
      }
    }

    // Rep performance analytics
    const repPerformance = salesReps.map(rep => {
      const repCalls = rep.activities.filter(a => a.type === ActivityType.COLD_CALL || a.type === ActivityType.WARM_CALL).length;
      const repEmails = rep.activities.filter(a => a.type === ActivityType.EMAIL_SENT).length;
      const repWonDeals = rep.deals.filter(d => d.stage === DealStage.CLOSED_WON);
      const repWonRevenue = repWonDeals.reduce((sum, d) => sum + d.value, 0);
      const repActiveDeals = rep.deals.filter(d => d.stage !== DealStage.CLOSED_WON && d.stage !== DealStage.CLOSED_LOST);
      const repPipeline = repActiveDeals.reduce((sum, d) => sum + d.value, 0);

      return {
        id: rep.id,
        name: rep.name,
        role: rep.role,
        avatar: rep.avatar,
        leadsAssigned: rep._count.contacts,
        calls: repCalls,
        emails: repEmails,
        wonDeals: repWonDeals.length,
        wonRevenue: repWonRevenue,
        activePipeline: repPipeline
      };
    });

    // Funnel stages
    const funnel = [
      { stage: 'Total Leads', count: totalContacts },
      { stage: 'Contacted', count: deals.length + callsCount },
      { stage: 'Opportunities', count: deals.length },
      { stage: 'Proposal / Neg', count: stageCounts.PROPOSAL.count + stageCounts.NEGOTIATION.count },
      { stage: 'Closed Won', count: wonDeals.length }
    ];

    return {
      kpi: {
        totalLeads: totalContacts,
        newLeads: newContactsInPeriod,
        emailsSent: emailsCount,
        callsMade: callsCount,
        activeDealsCount: activeDeals.length,
        totalPipelineValue,
        weightedPipelineValue,
        closedWonRevenue,
        conversionRate: Number(conversionRate.toFixed(1))
      },
      stageCounts,
      funnel,
      recentActivities,
      pendingTasks,
      repPerformance
    };
  }
}
