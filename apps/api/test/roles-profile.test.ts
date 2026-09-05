import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/server';
import { prisma } from '../src/config/prisma';
import bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';

describe('Role Management and Member Profile Test Suite', () => {
  let adminToken = '';
  let memberToken = '';
  let adminUser: any;
  let memberUser: any;
  let secondaryAdminUser: any;

  beforeAll(async () => {
    // 1. Authenticate the default admin
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@7blocks.com', password: '7Blocks@2026!' });
    expect(adminLogin.status).toBe(200);
    adminToken = adminLogin.body.data.accessToken;
    adminUser = adminLogin.body.data.user;

    // 2. Ensure test member user exists
    const memberEmail = 'test.member@7blocks.com';
    let member = await prisma.user.findUnique({ where: { email: memberEmail } });
    if (!member) {
      const passwordHash = await bcrypt.hash('TestMember@2026!', 10);
      member = await prisma.user.create({
        data: {
          name: 'Test Member',
          email: memberEmail,
          passwordHash,
          role: UserRole.SALES_REP,
          isActive: true
        }
      });
    }
    memberUser = member;

    // Login as member
    const memberLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: memberEmail, password: 'TestMember@2026!' });
    expect(memberLogin.status).toBe(200);
    memberToken = memberLogin.body.data.accessToken;

    // 3. Ensure a secondary test admin exists for multi-admin tests
    const secondaryAdminEmail = 'secondary.admin@7blocks.com';
    let secAdmin = await prisma.user.findUnique({ where: { email: secondaryAdminEmail } });
    if (!secAdmin) {
      const passwordHash = await bcrypt.hash('Admin@2026!', 10);
      secAdmin = await prisma.user.create({
        data: {
          name: 'Secondary Admin',
          email: secondaryAdminEmail,
          passwordHash,
          role: UserRole.ADMIN,
          isActive: true
        }
      });
    }
    secondaryAdminUser = secAdmin;
  });

  describe('Self-Profile Management (PATCH /api/users/profile)', () => {
    it('1. Authenticated user can update their own name', async () => {
      const res = await request(app)
        .patch('/api/users/profile')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ name: 'Updated Member Name' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Updated Member Name');
    });

    it('2. Authenticated user can update their own email', async () => {
      const newEmail = `member.${Date.now()}@7blocks.com`;
      const res = await request(app)
        .patch('/api/users/profile')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ email: newEmail });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe(newEmail.toLowerCase());
    });

    it('3. Duplicate email update is rejected', async () => {
      const res = await request(app)
        .patch('/api/users/profile')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ email: 'admin@7blocks.com' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('EMAIL_ALREADY_EXISTS');
    });

    it('4. Invalid email format is rejected by schema validator', async () => {
      const res = await request(app)
        .patch('/api/users/profile')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ email: 'not-a-valid-email' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('5. Self-privilege escalation is prevented (role field in self-update is ignored)', async () => {
      const res = await request(app)
        .patch('/api/users/profile')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ role: 'ADMIN' });

      expect(res.status).toBe(200);
      // Role remains SALES_REP
      expect(res.body.data.role).toBe(UserRole.SALES_REP);
    });

    it('6. Unauthenticated profile update returns 401 Unauthorized', async () => {
      const res = await request(app)
        .patch('/api/users/profile')
        .send({ name: 'Hacker' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Profile Photo Upload (POST /api/users/avatar)', () => {
    it('7. Uploads valid PNG image and updates avatar', async () => {
      const fakePng = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
        0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89
      ]);

      const res = await request(app)
        .post('/api/users/avatar')
        .set('Authorization', `Bearer ${memberToken}`)
        .attach('avatar', fakePng, 'avatar.png');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.avatar).toContain('data:image/png;base64,');
    });

    it('8. Rejects non-image file upload', async () => {
      const res = await request(app)
        .post('/api/users/avatar')
        .set('Authorization', `Bearer ${memberToken}`)
        .attach('avatar', Buffer.from('console.log("hello")'), { filename: 'script.js', contentType: 'application/javascript' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_FILE_TYPE');
    });

    it('9. Rejects avatar request with no file attached', async () => {
      const res = await request(app)
        .post('/api/users/avatar')
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FILE_MISSING');
    });
  });

  describe('Admin Role Management & Security Controls', () => {
    it('10. Non-admin cannot access admin user update endpoint (403 Forbidden)', async () => {
      const res = await request(app)
        .patch(`/api/users/${adminUser.id}`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ name: 'Hacked Name' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('11. Non-admin cannot change any user role (403 Forbidden)', async () => {
      const res = await request(app)
        .patch(`/api/users/${memberUser.id}/role`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ role: 'ADMIN' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('12. Admin can promote SALES_REP to MANAGER', async () => {
      const res = await request(app)
        .patch(`/api/users/${memberUser.id}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'MANAGER' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.role).toBe(UserRole.MANAGER);
    });

    it('13. Admin can promote MANAGER to ADMIN', async () => {
      const res = await request(app)
        .patch(`/api/users/${memberUser.id}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'ADMIN' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.role).toBe(UserRole.ADMIN);
    });

    it('14. Admin can demote ADMIN to SALES_REP when another active admin exists', async () => {
      // Both adminUser and secondaryAdminUser are active admins
      const res = await request(app)
        .patch(`/api/users/${memberUser.id}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'SALES_REP' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.role).toBe(UserRole.SALES_REP);
    });

    it('15. Admin can update member profile info (name and email)', async () => {
      const newEmail = `member.updated.${Date.now()}@7blocks.com`;
      const res = await request(app)
        .patch(`/api/users/${memberUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Member Updated By Admin', email: newEmail });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Member Updated By Admin');
      expect(res.body.data.email).toBe(newEmail);
    });

    it('16. Protection rule: Rejects demoting the last active administrator', async () => {
      // First, temporarily deactivate or demote secondaryAdminUser so only one active admin remains
      await prisma.user.update({
        where: { id: secondaryAdminUser.id },
        data: { isActive: false }
      });

      // Now attempt to demote the sole remaining active admin
      const res = await request(app)
        .patch(`/api/users/${adminUser.id}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'SALES_REP' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('LAST_ADMIN_PROTECTED');

      // Restore secondary admin
      await prisma.user.update({
        where: { id: secondaryAdminUser.id },
        data: { isActive: true }
      });
    });

    it('17. Protection rule: Rejects deactivating the last active administrator', async () => {
      // Temporarily deactivate secondaryAdminUser
      await prisma.user.update({
        where: { id: secondaryAdminUser.id },
        data: { isActive: false }
      });

      // Attempt to deactivate the sole active admin
      const res = await request(app)
        .patch(`/api/users/${adminUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isActive: false });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('LAST_ADMIN_PROTECTED');

      // Restore secondary admin
      await prisma.user.update({
        where: { id: secondaryAdminUser.id },
        data: { isActive: true }
      });
    });

    it('18. GET /api/users supports includeInactive for Admin', async () => {
      const res = await request(app)
        .get('/api/users?includeInactive=true')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });
});
