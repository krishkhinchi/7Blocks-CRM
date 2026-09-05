import { Router } from 'express';
import { SearchController } from './search.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', SearchController.globalSearch);

export default router;
