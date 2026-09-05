import { Router } from 'express';
import { TagsController } from './tags.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', TagsController.list);
router.post('/', TagsController.create);

export default router;
