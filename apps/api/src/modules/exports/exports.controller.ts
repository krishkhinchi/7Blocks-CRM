import { Request, Response, NextFunction } from 'express';
import * as XLSX from 'xlsx';
import { prisma } from '../../config/prisma';
import { AuditAction } from '@prisma/client';

export class ExportsController {
  static async exportContacts(req: Request, res: Response, next: NextFunction) {
    try {
      const format = (req.query.format as string) || 'csv';
      const contacts = await prisma.contact.findMany({
        where: { deletedAt: null },
        include: {
          company: { select: { name: true } },
          owner: { select: { name: true } },
          tags: { include: { tag: true } }
        },
        orderBy: { createdAt: 'desc' }
      });

      const rows = contacts.map(c => ({
        'Contact Name': c.fullName,
        'Email': c.email || '',
        'Phone': c.phone || '',
        'Company': c.company?.name || '',
        'Job Title': c.jobTitle || '',
        'Lead Status': c.leadStatus,
        'Lifecycle Stage': c.lifecycleStage,
        'Service Interest': c.serviceInterest || '',
        'Lead Score': c.leadScore,
        'Owner': c.owner?.name || '',
        'Website': c.website || '',
        'Tags': c.tags.map(t => t.tag.name).join(', '),
        'Created At': c.createdAt.toISOString()
      }));

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Contacts');

      await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          action: AuditAction.EXPORT_CREATED,
          entityType: 'Contact',
          entityId: 'ALL',
          newValues: { format, rowCount: rows.length }
        }
      });

      if (format === 'xlsx') {
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        res.setHeader('Content-Disposition', 'attachment; filename="7blocks_contacts.xlsx"');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buffer);
      } else {
        const csv = XLSX.utils.sheet_to_csv(worksheet);
        res.setHeader('Content-Disposition', 'attachment; filename="7blocks_contacts.csv"');
        res.setHeader('Content-Type', 'text/csv');
        res.send(csv);
      }
    } catch (error) {
      next(error);
    }
  }

  static async exportDeals(req: Request, res: Response, next: NextFunction) {
    try {
      const format = (req.query.format as string) || 'csv';
      const deals = await prisma.deal.findMany({
        where: { deletedAt: null },
        include: {
          company: { select: { name: true } },
          contact: { select: { fullName: true } },
          owner: { select: { name: true } }
        },
        orderBy: { createdAt: 'desc' }
      });

      const rows = deals.map(d => ({
        'Deal Name': d.name,
        'Value (INR)': d.value,
        'Stage': d.stage,
        'Probability (%)': d.probability,
        'Weighted Value': (d.value * d.probability) / 100,
        'Expected Close Date': d.expectedCloseDate ? d.expectedCloseDate.toISOString().split('T')[0] : '',
        'Contact': d.contact?.fullName || '',
        'Company': d.company?.name || '',
        'Owner': d.owner?.name || '',
        'Service Type': d.serviceType || '',
        'Lost Reason': d.lostReason || ''
      }));

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Deals');

      if (format === 'xlsx') {
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        res.setHeader('Content-Disposition', 'attachment; filename="7blocks_deals.xlsx"');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buffer);
      } else {
        const csv = XLSX.utils.sheet_to_csv(worksheet);
        res.setHeader('Content-Disposition', 'attachment; filename="7blocks_deals.csv"');
        res.setHeader('Content-Type', 'text/csv');
        res.send(csv);
      }
    } catch (error) {
      next(error);
    }
  }
}
