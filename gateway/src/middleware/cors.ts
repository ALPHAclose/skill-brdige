import cors from 'cors';

import { corsOrigins } from '../config/env';
import { HttpError } from '../utils/httpError';

export const corsMiddleware = cors({
  credentials: true,
  origin(origin, callback) {
    if (!origin || corsOrigins.includes('*') || corsOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new HttpError(403, 'Origin is not allowed by CORS'));
  },
  allowedHeaders: ['Authorization', 'Content-Type', 'X-Request-Id'],
  exposedHeaders: ['X-Request-Id'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
});
