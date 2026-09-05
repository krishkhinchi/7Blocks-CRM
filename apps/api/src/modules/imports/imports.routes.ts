import { Router } from 'express';
import multer from 'multer';
import { ImportsController } from './imports.controller';
import { authenticate, authorize } from '../../middleware/auth';
import { UserRole } from '@prisma/client';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 } // 15 MB limit
});

const router = Router();

router.use(authenticate);

router.post('/preview', upload.single('file'), ImportsController.preview);
router.post('/execute', authorize(UserRole.ADMIN, UserRole.MANAGER), upload.single('file'), ImportsController.execute);
router.get('/batches', ImportsController.listBatches);

export default router;
