import { Router } from 'express';

import { prisma } from '../../lib/prisma';
import { redisClient } from '../../lib/redis';
import { asyncHandler } from '../../utils/asyncHandler';

export const healthRoutes = Router();

/**
 * @openapi
 * /health:
 *   get:
 *     tags:
 *       - Health
 *     summary: Check Server1 health and dependencies
 *     responses:
 *       200:
 *         description: Server1 is healthy
 *       503:
 *         description: Server1 dependency is unhealthy
 */
healthRoutes.get(
  '/',
  asyncHandler(async (_req, res) => {
    const checks = {
      postgres: false,
      redis: false
    };

    try {
      await prisma.$queryRaw`SELECT 1`;
      checks.postgres = true;
    } catch {
      checks.postgres = false;
    }

    try {
      checks.redis = (await redisClient.ping()) === 'PONG';
    } catch {
      checks.redis = false;
    }

    const healthy = checks.postgres && checks.redis;

    res.status(healthy ? 200 : 503).json({
      success: healthy,
      service: 'server1',
      status: healthy ? 'healthy' : 'unhealthy',
      checks,
      timestamp: new Date().toISOString()
    });
  })
);
