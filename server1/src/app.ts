import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';

import { env, corsOrigins } from './config/env';
import { swaggerSpec } from './config/swagger';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFound';
import { requestId } from './middleware/requestId';
import { requestLogger } from './middleware/requestLogger';
import { requireTrustedGatewayUser } from './middleware/requireTrustedGatewayUser';
import { authRoutes } from './modules/auth/auth.routes';
import { healthRoutes } from './modules/health/health.routes';
import { notificationRoutes } from './modules/notifications/notification.routes';
import { userRoutes } from './modules/users/user.routes';
import { HttpError } from './utils/httpError';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');

  app.use(requestId);
  app.use(requestLogger);
  app.use(helmet());
  app.use(
    cors({
      credentials: true,
      origin(origin, callback) {
        if (!origin || corsOrigins.includes('*') || corsOrigins.includes(origin)) {
          callback(null, true);
          return;
        }

        callback(new HttpError(403, 'Origin is not allowed by CORS'));
      },
      allowedHeaders: [
        'Authorization',
        'Content-Type',
        'X-Request-Id',
        env.TRUSTED_GATEWAY_HEADER,
        'X-User-Id',
        'X-User-Role',
        'X-User-Email'
      ],
      exposedHeaders: ['X-Request-Id'],
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
    })
  );
  app.use(express.json({ limit: '1mb' }));

  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.use('/health', healthRoutes);
  app.use('/auth', authRoutes);
  app.use('/users', requireTrustedGatewayUser, userRoutes);
  app.use('/notifications', requireTrustedGatewayUser, notificationRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
