import { Router } from 'express';
import { ActivitiesController } from './activities.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', ActivitiesController.list);
router.post('/', ActivitiesController.logActivity);
router.post('/call', ActivitiesController.logCall);

export default router;
