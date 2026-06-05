import type { Express } from 'express';

export function registerHealthRoutes(app: Express) {
  app.get('/health', (_req, res) => {
    res.status(200).json({
      success: true,
      service: 'gateway',
      status: 'healthy',
      timestamp: new Date().toISOString()
    });
  });
}
