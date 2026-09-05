import { Router } from 'express';
import multer from 'multer';
import { UsersController } from './users.controller';
import { authenticate, authorize } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';
import { UserRole } from '@prisma/client';
import { updateProfileSchema, adminUpdateUserSchema, updateRoleSchema } from './users.schema';

const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 } // 2 MB limit
});

const router = Router();

router.use(authenticate);

// Self-service profile endpoints (all authenticated members)
router.get('/', UsersController.list);
router.patch('/profile', validateBody(updateProfileSchema), UsersController.updateProfile);
router.post('/avatar', avatarUpload.single('avatar'), UsersController.uploadAvatar);
router.get('/:id', UsersController.getById);

// Administrative role & member management (strictly ADMIN only)
router.patch('/:id/role', authorize(UserRole.ADMIN), validateBody(updateRoleSchema), UsersController.updateRole);
router.patch('/:id', authorize(UserRole.ADMIN), validateBody(adminUpdateUserSchema), UsersController.adminUpdate);

export default router;
