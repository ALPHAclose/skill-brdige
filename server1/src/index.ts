import http from 'node:http';

import { createApp } from './app';
import { env } from './config/env';
import { initSocketIO } from './lib/socketio';
import { prisma } from './lib/prisma';
import { connectRedis, disconnectRedis } from './lib/redis';

async function bootstrap() {
  await connectRedis();

  const app = createApp();
  const server = http.createServer(app);

  // Attach Socket.IO (uses its own dedicated Redis pub/sub clients)
  await initSocketIO(server);

  server.listen(env.PORT, () => {
    console.log(`Server1 is running on port ${env.PORT}`);
  });

  const shutdown = async (signal: string) => {
    console.log(`${signal} received. Shutting down Server1...`);
    server.close(async () => {
      await disconnectRedis();
      await prisma.$disconnect();
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

bootstrap().catch(async (error) => {
  console.error('Failed to start Server1', error);
  await disconnectRedis();
  await prisma.$disconnect();
  process.exit(1);
});
