import type { RequestHandler } from 'express';

import { env } from '../config/env';
import { identityHeaderNames } from '../utils/headers';

export const stripClientIdentityHeaders: RequestHandler = (req, _res, next) => {
  for (const headerName of identityHeaderNames(env.TRUSTED_GATEWAY_HEADER)) {
    delete req.headers[headerName.toLowerCase()];
  }

  next();
};
