import { Prisma, AuditAction } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError } from '../../middleware/errorHandler';
import { normalizeWebsite } from '../../utils/normalizer';

export class CompaniesService {
  static async list(query: { page?: number; limit?: number; search?: string; city?: string; ownerId?: string }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 25));
    const skip = (page - 1) * limit;

    const where: Prisma.CompanyWhereInput = {
      deletedAt: null
    };

    if (query.search) {
      where.OR = [
        { name: { contains: query.search.trim(), mode: 'insensitive' } },
        { domain: { contains: query.search.trim(), mode: 'insensitive' } },
        { city: { contains: query.search.trim(), mode: 'insensitive' } }
      ];
    }
    if (query.city) where.city = query.city;
    if (query.ownerId) where.ownerId = query.ownerId;

    const [total, companies] = await Promise.all([
      prisma.company.count({ where }),
      prisma.company.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          owner: { select: { id: true, name: true, email: true } },
          tags: { include: { tag: true } },
          _count: {
            select: { contacts: true, deals: true, activities: true }
          }
        }
      })
    ]);

    return {
      companies,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  static async getById(id: string) {
    const company = await prisma.company.findFirst({
      where: { id, deletedAt: null },
      include: {
        owner: { select: { id: true, name: true, email: true, avatar: true } },
        tags: { include: { tag: true } },
        contacts: {
          where: { deletedAt: null },
          select: { id: true, fullName: true, jobTitle: true, phone: true, email: true, leadStatus: true }
        },
        deals: {
          where: { deletedAt: null },
          select: { id: true, name: true, value: true, stage: true, probability: true }
        },
        activities: {
          take: 15,
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { id: true, name: true } } }
        }
      }
    });

    if (!company) {
      throw new AppError('Company not found', 404, 'COMPANY_NOT_FOUND');
    }

    return company;
  }

  static async create(data: any, userId: string) {
    const { normalizedUrl, domain } = normalizeWebsite(data.website);

    const company = await prisma.company.create({
      data: {
        name: data.name.trim(),
        website: normalizedUrl,
        domain: domain || data.domain || null,
        industry: data.industry || null,
        size: data.size || null,
        address: data.address || null,
        city: data.city || null,
        state: data.state || null,
        country: data.country || 'India',
        description: data.description || null,
        ownerId: data.ownerId || userId
      }
    });

    if (Array.isArray(data.tagIds) && data.tagIds.length > 0) {
      await prisma.companyTag.createMany({
        data: data.tagIds.map((tagId: string) => ({ companyId: company.id, tagId }))
      });
    }

    await prisma.auditLog.create({
      data: {
        userId,
        action: AuditAction.COMPANY_CREATED,
        entityType: 'Company',
        entityId: company.id,
        newValues: { name: company.name, domain: company.domain }
      }
    });

    return company;
  }

  static async update(id: string, data: any, userId: string) {
    const existing = await prisma.company.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Company not found', 404, 'COMPANY_NOT_FOUND');
    }

    const updateData: Prisma.CompanyUpdateInput = { ...data };
    if (data.website) {
      const { normalizedUrl, domain } = normalizeWebsite(data.website);
      updateData.website = normalizedUrl;
      if (domain) updateData.domain = domain;
    }

    const updated = await prisma.company.update({
      where: { id },
      data: updateData
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: AuditAction.COMPANY_UPDATED,
        entityType: 'Company',
        entityId: id,
        oldValues: { name: existing.name },
        newValues: { name: updated.name }
      }
    });

    return updated;
  }

  static async deleteAll(userId: string) {
    await prisma.company.updateMany({
      where: { deletedAt: null },
      data: { deletedAt: new Date() }
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: AuditAction.COMPANY_DELETED,
        entityType: 'Company',
        entityId: 'ALL',
        newValues: { description: 'All companies deleted' }
      }
    });

    return { message: 'All companies deleted successfully' };
  }

  static async delete(id: string, userId: string) {
    await prisma.company.update({
      where: { id },
      data: { deletedAt: new Date() }
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: AuditAction.COMPANY_DELETED,
        entityType: 'Company',
        entityId: id
      }
    });

    return { message: 'Company deleted successfully' };
  }
}
