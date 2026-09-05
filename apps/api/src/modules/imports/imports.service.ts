import * as XLSX from 'xlsx';
import { LeadStatus, LifecycleStage, LeadSource, ServiceInterest, ActivityType, ActivityOutcome, TaskPriority, TaskStatus, AuditAction } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { normalizePhone, normalizeEmail, normalizeWebsite } from '../../utils/normalizer';
import { AppError } from '../../middleware/errorHandler';

export interface ColumnMapping {
  companyName?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  website?: string;
  jobTitle?: string;
  city?: string;
  leadStatus?: string;
  serviceInterest?: string;
  emailSentCol?: string;      // e.g. SEND(Y/N)
  callingCol?: string;        // e.g. Calling(Y/N)
  callResponseCol?: string;   // e.g. Response
  notesCol?: string;
}

export class ImportsService {
  static parseFile(buffer: Buffer) {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

    if (!rawData || rawData.length === 0) {
      throw new AppError('The uploaded file is empty.', 400, 'EMPTY_FILE');
    }

    // Find headers from row 0
    const rawHeaders = rawData[0] as string[];
    const headers = rawHeaders.map((h, i) => (h !== undefined && h !== null && String(h).trim() !== '' ? String(h).trim() : `Column_${i}`));

    // Preview rows (up to 10)
    const previewRows = rawData.slice(1, 11).map((row, rowIdx) => {
      const rowObj: Record<string, any> = { _rowNumber: rowIdx + 2 };
      headers.forEach((h, colIdx) => {
        rowObj[h] = row[colIdx] !== undefined ? String(row[colIdx]).trim() : '';
      });
      return rowObj;
    });

    const is7BlocksCore = headers.some(h => h.includes('SEND')) && headers.some(h => h.includes('Calling'));

    return {
      sheetName,
      totalRows: Math.max(0, rawData.length - 1),
      headers,
      previewRows,
      is7BlocksCore
    };
  }

  static async executeImport(params: {
    buffer: Buffer;
    filename: string;
    mapping: ColumnMapping;
    duplicateHandling: 'skip' | 'update' | 'create_anyway';
    userId: string;
  }) {
    const { buffer, filename, mapping, duplicateHandling, userId } = params;
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

    if (rawData.length <= 1) {
      throw new AppError('No data rows to import.', 400, 'NO_DATA_ROWS');
    }

    const headers = (rawData[0] as string[]).map((h, i) => (h !== undefined && h !== null && String(h).trim() !== '' ? String(h).trim() : `Column_${i}`));
    const rows = rawData.slice(1);

    const getColVal = (row: any[], colName?: string): string | null => {
      if (!colName) return null;
      const idx = headers.indexOf(colName);
      if (idx === -1 || row[idx] === undefined || row[idx] === null) return null;
      const val = String(row[idx]).trim();
      return val === '' || val === '-' ? null : val;
    };

    let importedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    const errors: Array<{ row: number; error: string }> = [];

    // Ensure Default Tags exist
    const tagWebsiteNeeded = await prisma.tag.upsert({
      where: { name: 'Website Needed' },
      create: { name: 'Website Needed', color: '#f59e0b' },
      update: {}
    });
    const tagWebsiteUpdate = await prisma.tag.upsert({
      where: { name: 'Website Update' },
      create: { name: 'Website Update', color: '#3b82f6' },
      update: {}
    });

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2;

      try {
        const rawCompanyName = getColVal(row, mapping.companyName);
        const rawFullName = getColVal(row, mapping.fullName) || getColVal(row, mapping.firstName);
        const rawEmail = getColVal(row, mapping.email);
        const rawPhone = getColVal(row, mapping.phone);
        const rawWebsite = getColVal(row, mapping.website);
        const rawEmailSent = getColVal(row, mapping.emailSentCol);
        const rawCalling = getColVal(row, mapping.callingCol);
        const rawCallResponse = getColVal(row, mapping.callResponseCol);
        const rawNotes = getColVal(row, mapping.notesCol);

        // Discard empty spacer rows
        if (!rawCompanyName && !rawFullName && !rawEmail && !rawPhone) {
          continue;
        }

        // Clean & Normalize
        const email = normalizeEmail(rawEmail);
        const phone = normalizePhone(rawPhone);
        const { normalizedUrl, domain } = normalizeWebsite(rawWebsite);

        // Derive Contact & Company names
        let compName = rawCompanyName;
        let contName = rawFullName;

        if (!contName && compName) {
          contName = compName;
        } else if (!compName && contName) {
          compName = `${contName}'s Organization`;
        }

        if (!contName) {
          errorCount++;
          errors.push({ row: rowNumber, error: 'Missing both Contact Name and Company Name.' });
          continue;
        }

        // Semantic Service Interpretation
        let serviceInterest: ServiceInterest | null = null;
        const respText = (rawCallResponse || rawNotes || '').toLowerCase();
        const websiteColText = (getColVal(row, 'Response') || '').toLowerCase();

        if (websiteColText.includes('update') || respText.includes('update the website')) {
          serviceInterest = ServiceInterest.WEBSITE_REDESIGN;
        } else if (websiteColText.includes('no website') || respText.includes('no website')) {
          serviceInterest = ServiceInterest.WEBSITE_NEW;
        }

        // Duplicate Check
        let existingContact = null;
        if (duplicateHandling !== 'create_anyway') {
          const conditions: any[] = [];
          if (email) conditions.push({ email });
          if (phone) conditions.push({ phone });
          if (contName) conditions.push({ fullName: { equals: contName, mode: 'insensitive' } });

          if (conditions.length > 0) {
            existingContact = await prisma.contact.findFirst({
              where: { deletedAt: null, OR: conditions }
            });
          }
        }

        if (existingContact && duplicateHandling === 'skip') {
          skippedCount++;
          continue;
        }

        let companyRecord = null;
        if (compName) {
          companyRecord = await prisma.company.findFirst({
            where: {
              deletedAt: null,
              OR: [
                { name: { equals: compName, mode: 'insensitive' } },
                ...(domain ? [{ domain }] : [])
              ]
            }
          });

          if (!companyRecord) {
            companyRecord = await prisma.company.create({
              data: {
                name: compName,
                website: normalizedUrl,
                domain,
                ownerId: userId
              }
            });
          }
        }

        let contact;
        if (existingContact && duplicateHandling === 'update') {
          contact = await prisma.contact.update({
            where: { id: existingContact.id },
            data: {
              companyId: companyRecord?.id || existingContact.companyId,
              email: email || existingContact.email,
              phone: phone || existingContact.phone,
              website: normalizedUrl || existingContact.website,
              serviceInterest: serviceInterest || existingContact.serviceInterest
            }
          });
          updatedCount++;
        } else {
          contact = await prisma.contact.create({
            data: {
              firstName: contName.split(' ')[0] || 'Unknown',
              lastName: contName.split(' ').slice(1).join(' ') || null,
              fullName: contName,
              email,
              phone,
              companyId: companyRecord?.id,
              website: normalizedUrl,
              serviceInterest: serviceInterest || ServiceInterest.WEBSITE_NEW,
              leadSource: LeadSource.EXCEL_IMPORT,
              lifecycleStage: LifecycleStage.LEAD,
              leadStatus: LeadStatus.NEW,
              ownerId: userId
            }
          });
          importedCount++;
        }

        // Tag assignment based on service interest
        if (serviceInterest === ServiceInterest.WEBSITE_NEW) {
          await prisma.contactTag.upsert({
            where: { contactId_tagId: { contactId: contact.id, tagId: tagWebsiteNeeded.id } },
            create: { contactId: contact.id, tagId: tagWebsiteNeeded.id },
            update: {}
          });
        } else if (serviceInterest === ServiceInterest.WEBSITE_REDESIGN) {
          await prisma.contactTag.upsert({
            where: { contactId_tagId: { contactId: contact.id, tagId: tagWebsiteUpdate.id } },
            create: { contactId: contact.id, tagId: tagWebsiteUpdate.id },
            update: {}
          });
        }

        // 1. Email Outreach History
        if (rawEmailSent && rawEmailSent.toUpperCase().includes('Y')) {
          await prisma.activity.create({
            data: {
              type: ActivityType.EMAIL_SENT,
              title: 'Initial Email Outreach Campaign',
              description: `Automated historical log: Outreach email marked sent in Excel import.`,
              contactId: contact.id,
              companyId: companyRecord?.id,
              userId
            }
          });
          await prisma.contact.update({
            where: { id: contact.id },
            data: { leadStatus: LeadStatus.CONTACTED, lastContactedAt: new Date() }
          });
        }

        // 2. Calling Outreach & Semantic Response Interpretation
        if (rawCalling && rawCalling.toUpperCase().includes('Y')) {
          let outcome: ActivityOutcome = ActivityOutcome.OTHER;
          let status: LeadStatus = LeadStatus.CONTACTED;
          let taskToCreate: { title: string; due: Date; note: string } | null = null;

          const r = (rawCallResponse || '').toUpperCase();

          if (r.includes('5:30') || r.includes('BOSS')) {
            outcome = ActivityOutcome.CALLBACK_REQUESTED;
            status = LeadStatus.CALLBACK_SCHEDULED;
            taskToCreate = {
              title: `Call back boss at 5:30 PM`,
              due: new Date(new Date().setHours(17, 30, 0, 0)),
              note: `Boss requested callback: ${rawCallResponse}`
            };
          } else if (r.includes('MEETING LEFT') || r.includes('MEETING')) {
            outcome = ActivityOutcome.MEETING_REQUESTED;
            status = LeadStatus.MEETING_SCHEDULED;
            taskToCreate = {
              title: `Follow up on requested meeting with ${contact.fullName}`,
              due: new Date(Date.now() + 2 * 86400000),
              note: `Meeting response recorded: ${rawCallResponse}`
            };
          } else if (r.includes('NEXT MONTH') || r.includes('APPROCH')) {
            outcome = ActivityOutcome.FOLLOW_UP_REQUIRED;
            status = LeadStatus.CALLBACK_SCHEDULED;
            taskToCreate = {
              title: `Next month follow-up approach: ${contact.fullName}`,
              due: new Date(Date.now() + 30 * 86400000),
              note: `Client indicated next month approach: ${rawCallResponse}`
            };
          } else if (r.includes('SEND DEMO') || r.includes('DEMO')) {
            outcome = ActivityOutcome.DEMO_REQUESTED;
            status = LeadStatus.DEMO_SCHEDULED;
            taskToCreate = {
              title: `Send product demo to ${contact.fullName}`,
              due: new Date(Date.now() + 86400000),
              note: `Demo requested in call response: ${rawCallResponse}`
            };
          } else if (r.includes('BLOCKED')) {
            outcome = ActivityOutcome.DO_NOT_CONTACT;
            status = LeadStatus.DO_NOT_CONTACT;
          } else if (r.includes('NOT RECEIVED') || r.includes('INCOMING CALL NOT RECEIVED')) {
            outcome = ActivityOutcome.NO_ANSWER;
          } else if (r.includes('WHATS UP') || r.includes('WHATSAPP')) {
            outcome = ActivityOutcome.BUSY;
            await prisma.activity.create({
              data: {
                type: ActivityType.WHATSAPP,
                title: 'WhatsApp message left',
                description: `WhatsApp message left following call interaction.`,
                contactId: contact.id,
                companyId: companyRecord?.id,
                userId
              }
            });
          } else if (r.includes('VISIT OFFLINE')) {
            outcome = ActivityOutcome.MEETING_REQUESTED;
            status = LeadStatus.MEETING_SCHEDULED;
            taskToCreate = {
              title: `Schedule offline visit / meeting with ${contact.fullName}`,
              due: new Date(Date.now() + 3 * 86400000),
              note: `Client requested offline visit: ${rawCallResponse}`
            };
          } else if (r.includes('ALREADY HAVE SOFTWARE') || r.includes('NO NEED') || r.includes('NOT WEBSITE NEED')) {
            outcome = ActivityOutcome.ALREADY_HAS_SOLUTION;
            status = LeadStatus.LOST;
          }

          // Create Call Activity
          await prisma.activity.create({
            data: {
              type: ActivityType.COLD_CALL,
              title: `Imported Cold Call Log`,
              description: rawCallResponse ? `Excel Response: "${rawCallResponse}"` : 'Cold call conducted.',
              outcome,
              notes: rawCallResponse || undefined,
              contactId: contact.id,
              companyId: companyRecord?.id,
              userId
            }
          });

          // Update Contact Status
          await prisma.contact.update({
            where: { id: contact.id },
            data: { leadStatus: status, lastContactedAt: new Date() }
          });

          // Create follow-up task if identified
          if (taskToCreate) {
            await prisma.task.create({
              data: {
                title: taskToCreate.title,
                description: taskToCreate.note,
                dueDate: taskToCreate.due,
                priority: TaskPriority.HIGH,
                status: TaskStatus.TODO,
                assignedToId: userId,
                contactId: contact.id,
                companyId: companyRecord?.id
              }
            });
          }
        }
      } catch (err: any) {
        errorCount++;
        errors.push({ row: rowNumber, error: err.message || 'Processing failed' });
      }
    }

    // Record ImportBatch
    const batch = await prisma.importBatch.create({
      data: {
        filename,
        uploadedById: userId,
        totalRows: rows.length,
        importedRows: importedCount,
        updatedRows: updatedCount,
        skippedRows: skippedCount,
        errorRows: errorCount,
        errors: errors.length > 0 ? errors : undefined,
        status: errorCount === rows.length ? 'FAILED' : (errorCount > 0 ? 'PARTIAL' : 'COMPLETED')
      }
    });

    // Audit Log
    await prisma.auditLog.create({
      data: {
        userId,
        action: AuditAction.IMPORT_COMPLETED,
        entityType: 'ImportBatch',
        entityId: batch.id,
        newValues: { total: rows.length, imported: importedCount, updated: updatedCount, skipped: skippedCount, errors: errorCount }
      }
    });

    return {
      batchId: batch.id,
      totalRows: rows.length,
      importedCount,
      updatedCount,
      skippedCount,
      errorCount,
      errors
    };
  }
}
