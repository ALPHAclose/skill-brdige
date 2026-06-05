import type { Server as HttpServer } from 'node:http';

import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { Server } from 'socket.io';

import { env } from '../config/env';
import type { ClientToServerEvents, InterServerEvents, ServerToClientEvents, SocketData } from '../modules/socket/socket.types';
import { authenticateSocket } from '../modules/socket/socket.middleware';
import { registerSocketHandlers } from '../modules/socket/socket.handlers';
import { setSocketIO } from '../modules/socket/socket.service';

export async function initSocketIO(httpServer: HttpServer): Promise<void> {
  const pubClient = createClient({ url: env.REDIS_URL });
  const subClient = pubClient.duplicate();

  await Promise.all([pubClient.connect(), subClient.connect()]);

  pubClient.on('error', (err) => console.error('[Socket.IO Redis pub]', err));
  subClient.on('error', (err) => console.error('[Socket.IO Redis sub]', err));

  const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(httpServer, {
    path: '/socket.io',
    cors: {
      origin: env.CORS_ORIGIN.split(',').map((o) => o.trim()),
      credentials: true
    },
    transports: ['websocket', 'polling'],
    connectionStateRecovery: {
      maxDisconnectionDuration: 2 * 60 * 1000
    }
  });

  io.adapter(createAdapter(pubClient, subClient));

  // Inject the io instance into socket.service BEFORE registering handlers
  // so that any emit called from within handlers (via notification.service)
  // has a valid reference.
  setSocketIO(io);

  io.use(authenticateSocket);

  registerSocketHandlers(io);

  console.log('[Socket.IO] Initialised with Redis adapter');
}
