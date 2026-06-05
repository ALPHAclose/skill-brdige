import rateLimit from 'express-rate-limit';

import { env } from '../config/env';

export const rateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  limit: env.RATE_LIMIT_MAX,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: (req) => req.path === '/health',
  message: {
    success: false,
    error: {
      message: 'Too many requests, please try again later',
      statusCode: 429
    }
  }
});
