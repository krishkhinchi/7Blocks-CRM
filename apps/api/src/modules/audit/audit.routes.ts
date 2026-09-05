import { Router } from 'express';
import { AuditController } from './audit.controller';
import { authenticate, authorize } from '../../middleware/auth';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(authenticate);
// Audit logs are accessible to ADMIN and MANAGER
router.get('/', authorize(UserRole.ADMIN, UserRole.MANAGER), AuditController.list);

export default router;
