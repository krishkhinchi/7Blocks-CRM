import { Router } from 'express';
import { AuthController } from './auth.controller';
import { authenticate } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';
import { authLimiter } from '../../middleware/rateLimiter';
import { loginSchema, registerSchema, refreshSchema } from './auth.schema';

const router = Router();

router.post('/login', authLimiter, validateBody(loginSchema), AuthController.login);
router.post('/register', validateBody(registerSchema), AuthController.register);
router.post('/refresh', validateBody(refreshSchema), AuthController.refresh);
router.get('/me', authenticate, AuthController.me);
router.post('/logout', authenticate, AuthController.logout);

export default router;
