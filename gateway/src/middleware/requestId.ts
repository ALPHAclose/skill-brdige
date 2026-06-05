import { randomUUID } from 'node:crypto';

import type { RequestHandler } from 'express';

export const requestId: RequestHandler = (req, res, next) => {
  req.requestId = req.header('X-Request-Id') ?? randomUUID();
  res.setHeader('X-Request-Id', req.requestId);
  next();
};
