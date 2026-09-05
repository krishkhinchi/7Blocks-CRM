import { Router } from 'express';
import { MeetingsController } from './meetings.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', MeetingsController.list);
router.post('/', MeetingsController.create);
router.patch('/:id/status', MeetingsController.updateStatus);
router.patch('/:id', MeetingsController.update);
router.delete('/:id', MeetingsController.delete);

export default router;
