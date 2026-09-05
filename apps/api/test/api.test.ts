import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/server';

let authToken = '';

describe('7BLOCKS CRM Backend API Test Suite', () => {
  it('GET /health - should return server health status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.product).toBe('7BLOCKS CRM');
  });

  describe('Authentication Module', () => {
    it('POST /api/auth/login - should fail with wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@7blocks.com', password: 'WrongPassword123' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('POST /api/auth/login - should authenticate admin and return JWT', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@7blocks.com', password: '7Blocks@2026!' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.user.role).toBe('ADMIN');

      authToken = res.body.data.accessToken;
    });

    it('GET /api/auth/me - should return authenticated user profile', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe('admin@7blocks.com');
    });
  });

  describe('Contacts & Companies Modules', () => {
    let testContactId = '';

    it('GET /api/contacts - should list seeded contacts with server-side pagination', async () => {
      const res = await request(app)
        .get('/api/contacts?page=1&limit=10')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.total).toBeGreaterThanOrEqual(50);
    });

    it('GET /api/contacts?search=Kunal - should find Kunal Sharma case-insensitively', async () => {
      const res = await request(app)
        .get('/api/contacts?search=kunal')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].fullName).toContain('Kunal');
    });

    it('POST /api/contacts - should create a new normalized contact', async () => {
      const res = await request(app)
        .post('/api/contacts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          firstName: 'Kabir',
          lastName: 'Mehta',
          fullName: 'Kabir Mehta',
          email: 'Kabir.Mehta@ExampleFit.in',
          phone: '098200 11223',
          jobTitle: 'Club Owner',
          leadStatus: 'NEW',
          serviceInterest: 'WEBSITE_NEW'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.phone).toBe('+919820011223'); // Normalization test
      expect(res.body.data.email).toBe('kabir.mehta@examplefit.in'); // Lowercase normalization

      testContactId = res.body.data.id;
    });

    it('POST /api/activities/call - should log a call and automatically generate a callback task', async () => {
      const res = await request(app)
        .post('/api/activities/call')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          contactId: testContactId,
          callType: 'COLD_CALL',
          outcome: 'CALLBACK_REQUESTED',
          durationSeconds: 150,
          notes: 'Spoke with Kabir. He is interested in website redesign. Requested callback at 5:00 PM.',
          followUpRequired: true,
          followUpDate: new Date(Date.now() + 86400000).toISOString(),
          followUpTaskTitle: 'Call back Kabir Mehta'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.activity.outcome).toBe('CALLBACK_REQUESTED');
      expect(res.body.data.followUpTask).toBeDefined();
      expect(res.body.data.followUpTask.title).toBe('Call back Kabir Mehta');
    });
  });

  describe('Deals & Pipeline Modules', () => {
    it('GET /api/deals/kanban - should return structured columns with stage totals', async () => {
      const res = await request(app)
        .get('/api/deals/kanban')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(6); // 6 Kanban columns

      const proposalCol = res.body.data.find((c: any) => c.stage === 'PROPOSAL');
      expect(proposalCol).toBeDefined();
      expect(proposalCol.count).toBeGreaterThanOrEqual(1);
      expect(proposalCol.totalValue).toBeGreaterThan(0);
    });

    it('GET /api/deals/analytics - should compute pipeline and weighted revenue', async () => {
      const res = await request(app)
        .get('/api/deals/analytics')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.totalPipelineValue).toBeGreaterThan(0);
      expect(res.body.data.weightedPipelineValue).toBeGreaterThan(0);
      expect(res.body.data.winRate).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Tasks & Follow-ups Module', () => {
    it('GET /api/tasks/categorized - should group tasks into Overdue, Today, and Upcoming', async () => {
      const res = await request(app)
        .get('/api/tasks/categorized')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.overdue).toBeDefined();
      expect(res.body.data.today).toBeDefined();
      expect(res.body.data.stats.totalPending).toBeGreaterThan(0);
    });
  });

  describe('Dashboard Analytics Module', () => {
    it('GET /api/dashboard - should return top KPI cards, funnel and rep metrics', async () => {
      const res = await request(app)
        .get('/api/dashboard?timeframe=30days')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.kpi.totalLeads).toBeGreaterThanOrEqual(50);
      expect(res.body.data.funnel.length).toBe(5);
      expect(Array.isArray(res.body.data.repPerformance)).toBe(true);
    });
  });

  describe('Global Search Module (Ctrl+K)', () => {
    it('GET /api/search?q=gym - should search across contacts, companies, deals', async () => {
      const res = await request(app)
        .get('/api/search?q=gym')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.companies.length).toBeGreaterThan(0);
    });
  });
});
