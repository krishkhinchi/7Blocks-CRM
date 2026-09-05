import { Router } from 'express';
import { NotificationsController } from './notifications.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', NotificationsController.list);
router.patch('/:id/read', NotificationsController.markAsRead);
router.post('/mark-all-read', NotificationsController.markAllAsRead);

export default router;
