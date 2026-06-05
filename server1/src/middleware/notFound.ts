import type { RequestHandler } from 'express';

import { HttpError } from '../utils/httpError';

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(new HttpError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};
