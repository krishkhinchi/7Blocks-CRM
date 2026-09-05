import rateLimit from 'express-rate-limit';
import { ENV } from '../config/env';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 attempts per IP per window
  skipSuccessfulRequests: true, // Do not penalize successful logins
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many authentication attempts. Please try again in 15 minutes.'
    }
  }
});

export const apiLimiter = rateLimit({
  windowMs: ENV.RATE_LIMIT_WINDOW_MS,
  max: ENV.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Rate limit exceeded. Please slow down your requests.'
    }
  }
});

export const emailLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'EMAIL_RATE_LIMIT',
      message: 'Email rate limit exceeded. You can only send up to 10 emails per minute.'
    }
  }
});
