import { Router } from 'express';
import { CompaniesController } from './companies.controller';
import { authenticate, authorize } from '../../middleware/auth';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(authenticate);

router.get('/', CompaniesController.list);
router.get('/:id', CompaniesController.getById);
router.post('/', CompaniesController.create);
router.patch('/:id', CompaniesController.update);
router.delete('/:id', authorize(UserRole.ADMIN, UserRole.MANAGER), CompaniesController.delete);

export default router;
