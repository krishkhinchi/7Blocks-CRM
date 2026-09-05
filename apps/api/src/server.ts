import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { ENV } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimiter';

// Import route modules
import authRoutes from './modules/auth/auth.routes';
import usersRoutes from './modules/users/users.routes';
import contactsRoutes from './modules/contacts/contacts.routes';
import companiesRoutes from './modules/companies/companies.routes';
import activitiesRoutes from './modules/activities/activities.routes';
import dealsRoutes from './modules/deals/deals.routes';
import tasksRoutes from './modules/tasks/tasks.routes';
import meetingsRoutes from './modules/meetings/meetings.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';
import searchRoutes from './modules/search/search.routes';
import importsRoutes from './modules/imports/imports.routes';
import exportsRoutes from './modules/exports/exports.routes';
import emailsRoutes from './modules/emails/emails.routes';
import auditRoutes from './modules/audit/audit.routes';
import notificationsRoutes from './modules/notifications/notifications.routes';
import tagsRoutes from './modules/tags/tags.routes';

// Swagger document
import swaggerDoc from './docs/swagger.json';

const app = express();

// Trust proxy for Vercel / reverse proxy deployment
app.set('trust proxy', 1);

// Security Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, server-to-server)
    if (!origin) return callback(null, true);
    const allowedPatterns = [
      /^http:\/\/localhost:\d+$/,
      /^http:\/\/127\.0\.0\.1:\d+$/,
      /\.vercel\.app$/,
      /\.7blocks\.in$/,
    ];
    // Also allow explicit CORS_ORIGIN
    if (ENV.CORS_ORIGIN && ENV.CORS_ORIGIN !== '*') {
      allowedPatterns.push(new RegExp('^' + ENV.CORS_ORIGIN.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$'));
    }
    if (ENV.CORS_ORIGIN === '*' || allowedPatterns.some(p => p.test(origin))) {
      return callback(null, true);
    }
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true
}));

// Logging & Body Parsers
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// General Rate Limiter
app.use('/api', apiLimiter);

// Health Check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    product: '7BLOCKS CRM',
    timestamp: new Date().toISOString(),
    env: ENV.NODE_ENV
  });
});

// Swagger Documentation Mount
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));

// Mount REST API Modules
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/contacts', contactsRoutes);
app.use('/api/companies', companiesRoutes);
app.use('/api/activities', activitiesRoutes);
app.use('/api/deals', dealsRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/meetings', meetingsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/imports', importsRoutes);
app.use('/api/exports', exportsRoutes);
app.use('/api/emails', emailsRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/tags', tagsRoutes);

// 404 Route Handler
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `The endpoint ${req.method} ${req.originalUrl} does not exist.`
    }
  });
});

// Centralized Error Handler
app.use(errorHandler);

// Start server if not running in test mode or Vercel serverless
if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  app.listen(ENV.PORT, () => {
    console.log(`=========================================`);
    console.log(`🚀 7BLOCKS CRM API Server`);
    console.log(`📡 URL: http://localhost:${ENV.PORT}`);
    console.log(`📚 Swagger Docs: http://localhost:${ENV.PORT}/api/docs`);
    console.log(`=========================================`);
  });
}

export default app;
