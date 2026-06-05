import type { RequestHandler } from 'express';

import { isPublicRoute } from '../constants/routes';
import { verifyAccessTokenFromRequest } from '../utils/jwt';

export const authenticateJwt: RequestHandler = (req, _res, next) => {
  if (isPublicRoute(req)) {
    next();
    return;
  }

  try {
    req.user = verifyAccessTokenFromRequest(req);
    next();
  } catch (error) {
    next(error);
  }
};
