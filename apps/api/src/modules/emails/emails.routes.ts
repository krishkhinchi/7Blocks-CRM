import { Router } from 'express';
import { EmailsController } from './emails.controller';
import { authenticate } from '../../middleware/auth';
import { emailLimiter } from '../../middleware/rateLimiter';

const router = Router();

// Public webhook endpoint for email providers (SendGrid / webhooks)
router.post('/webhook', EmailsController.webhook);

// Authenticated routes
router.use(authenticate);

router.get('/status', EmailsController.getStatus);
router.get('/templates', EmailsController.getTemplates);
router.post('/render', EmailsController.renderTemplate);
router.post('/send', emailLimiter, EmailsController.send);
router.get('/logs', EmailsController.listLogs);

export default router;
