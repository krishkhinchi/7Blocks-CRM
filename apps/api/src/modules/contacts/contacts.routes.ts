import { Router } from 'express';
import { ContactsController } from './contacts.controller';
import { authenticate, authorize } from '../../middleware/auth';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(authenticate);

router.get('/', ContactsController.list);
router.get('/check-duplicates', ContactsController.checkDuplicates);
router.get('/:id', ContactsController.getById);
router.post('/', ContactsController.create);
router.patch('/:id', ContactsController.update);
router.delete('/:id', authorize(UserRole.ADMIN, UserRole.MANAGER), ContactsController.delete);
router.post('/bulk', ContactsController.bulk);

export default router;
