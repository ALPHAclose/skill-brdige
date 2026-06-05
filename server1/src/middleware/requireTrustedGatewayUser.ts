import type { RequestHandler } from 'express';
import { Role } from '@prisma/client';

import { env } from '../config/env';
import { HttpError } from '../utils/httpError';

const roleValues = new Set<string>(Object.values(Role));

export const requireTrustedGatewayUser: RequestHandler = (req, _res, next) => {
  const trustedSecret = req.get(env.TRUSTED_GATEWAY_HEADER);

  if (trustedSecret !== env.TRUSTED_GATEWAY_SECRET) {
    next(new HttpError(401, 'Request did not come from the trusted API Gateway'));
    return;
  }

  const id = req.get('X-User-Id');
  const email = req.get('X-User-Email');
  const role = req.get('X-User-Role');

  if (!id || !email || !role) {
    next(new HttpError(401, 'Missing trusted user headers'));
    return;
  }

  if (!roleValues.has(role)) {
    next(new HttpError(403, 'Unsupported user role'));
    return;
  }

  req.user = {
    id,
    email,
    role: role as Role
  };

  next();
};
