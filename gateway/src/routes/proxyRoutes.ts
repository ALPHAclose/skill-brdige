import type { Express } from 'express';

import { env } from '../config/env';
import { createServiceProxy } from '../proxy/createServiceProxy';
import { createSocketProxy } from '../proxy/socketProxy';

export function registerProxyRoutes(app: Express) {
  const server1Proxy = createServiceProxy({ target: env.SERVER1_URL });
  const server2Proxy = createServiceProxy({ target: env.SERVER2_URL });
  const socketProxy = createSocketProxy();

  app.use('/auth', server1Proxy);
  app.use('/users', server1Proxy);
  app.use('/notifications', server1Proxy);
  app.use('/graphql', server2Proxy);
  app.use('/socket.io', socketProxy);
}
