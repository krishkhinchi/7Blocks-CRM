import { Router } from 'express';
import { DealsController } from './deals.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', DealsController.list);
router.get('/kanban', DealsController.getKanban);
router.get('/analytics', DealsController.getAnalytics);
router.get('/:id', DealsController.getById);
router.post('/', DealsController.create);
router.patch('/:id', DealsController.update);
router.patch('/:id/stage', DealsController.updateStage);

export default router;
