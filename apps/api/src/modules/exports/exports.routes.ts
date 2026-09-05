import { Router } from 'express';
import { ExportsController } from './exports.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/contacts', ExportsController.exportContacts);
router.get('/deals', ExportsController.exportDeals);

export default router;
