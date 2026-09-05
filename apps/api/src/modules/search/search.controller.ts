import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma';

export class SearchController {
  static async globalSearch(req: Request, res: Response, next: NextFunction) {
    try {
      const q = (req.query.q as string || '').trim();
      if (!q || q.length < 2) {
        res.status(200).json({
          success: true,
          data: { contacts: [], companies: [], deals: [], tasks: [], activities: [] }
        });
        return;
      }

      const [contacts, companies, deals, tasks, activities] = await Promise.all([
        prisma.contact.findMany({
          where: {
            deletedAt: null,
            OR: [
              { fullName: { contains: q, mode: 'insensitive' } },
              { email: { contains: q, mode: 'insensitive' } },
              { phone: { contains: q } }
            ]
          },
          select: { id: true, fullName: true, email: true, phone: true, jobTitle: true, company: { select: { name: true } }, leadStatus: true },
          take: 6
        }),
        prisma.company.findMany({
          where: {
            deletedAt: null,
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { domain: { contains: q, mode: 'insensitive' } },
              { city: { contains: q, mode: 'insensitive' } }
            ]
          },
          select: { id: true, name: true, domain: true, city: true },
          take: 5
        }),
        prisma.deal.findMany({
          where: {
            deletedAt: null,
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { description: { contains: q, mode: 'insensitive' } }
            ]
          },
          select: { id: true, name: true, value: true, stage: true, company: { select: { name: true } } },
          take: 5
        }),
        prisma.task.findMany({
          where: {
            OR: [
              { title: { contains: q, mode: 'insensitive' } },
              { description: { contains: q, mode: 'insensitive' } }
            ]
          },
          select: { id: true, title: true, dueDate: true, priority: true, status: true },
          take: 5
        }),
        prisma.activity.findMany({
          where: {
            OR: [
              { title: { contains: q, mode: 'insensitive' } },
              { notes: { contains: q, mode: 'insensitive' } }
            ]
          },
          select: { id: true, title: true, type: true, createdAt: true, contact: { select: { id: true, fullName: true } } },
          take: 5
        })
      ]);

      res.status(200).json({
        success: true,
        data: {
          contacts,
          companies,
          deals,
          tasks,
          activities
        }
      });
    } catch (error) {
      next(error);
    }
  }
}
