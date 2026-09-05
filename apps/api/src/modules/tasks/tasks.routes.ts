import { Router } from 'express';
import { TasksController } from './tasks.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', TasksController.list);
router.get('/categorized', TasksController.getCategorized);
router.post('/', TasksController.create);
router.patch('/:id/toggle', TasksController.toggle);
router.patch('/:id', TasksController.update);
router.delete('/:id', TasksController.delete);

export default router;
