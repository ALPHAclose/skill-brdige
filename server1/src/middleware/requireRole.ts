import type { RequestHandler } from 'express';
import type { Role } from '@prisma/client';

import { HttpError } from '../utils/httpError';

export function requireRole(...roles: Role[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) {
      next(new HttpError(401, 'Authentication is required'));
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(new HttpError(403, 'You do not have permission to access this resource'));
      return;
    }

    next();
  };
}
