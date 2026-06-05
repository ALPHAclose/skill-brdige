import { createClient } from 'redis';

import { env } from '../config/env';

export const redisClient = createClient({
  url: env.REDIS_URL
});

redisClient.on('error', (error) => {
  console.error('Redis error', error);
});

export async function connectRedis() {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
}

export async function disconnectRedis() {
  if (redisClient.isOpen) {
    await redisClient.quit();
  }
}
