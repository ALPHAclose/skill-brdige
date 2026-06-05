import express from 'express';
import helmet from 'helmet';

import { corsMiddleware } from './middleware/cors';
import { errorHandler } from './middleware/errorHandler';
import { authenticateJwt } from './middleware/jwtAuth';
import { notFoundHandler } from './middleware/notFound';
import { rateLimiter } from './middleware/rateLimiter';
import { requestLogger } from './middleware/requestLogger';
import { requestId } from './middleware/requestId';
import { stripClientIdentityHeaders } from './middleware/stripClientIdentityHeaders';
import { registerHealthRoutes } from './routes/healthRoutes';
import { registerProxyRoutes } from './routes/proxyRoutes';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');

  app.use(requestId);
  app.use(requestLogger);
  app.use(helmet());
  app.use(corsMiddleware);
  app.use(rateLimiter);
  app.use(stripClientIdentityHeaders);

  registerHealthRoutes(app);

  app.use(authenticateJwt);
  registerProxyRoutes(app);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
