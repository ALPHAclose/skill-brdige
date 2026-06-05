import type { ClientRequest, IncomingMessage } from 'node:http';

import { env } from '../config/env';
import type { AuthenticatedUser } from './jwt';

type UserAwareRequest = IncomingMessage & {
  user?: AuthenticatedUser;
};

export function identityHeaderNames(trustedGatewayHeader: string) {
  return ['x-user-id', 'x-user-role', 'x-user-email', trustedGatewayHeader.toLowerCase()];
}

export function attachTrustedHeaders(proxyReq: ClientRequest, req: IncomingMessage) {
  for (const headerName of identityHeaderNames(env.TRUSTED_GATEWAY_HEADER)) {
    proxyReq.removeHeader(headerName);
  }

  proxyReq.setHeader(env.TRUSTED_GATEWAY_HEADER, env.TRUSTED_GATEWAY_SECRET);

  const user = (req as UserAwareRequest).user;

  if (!user) {
    return;
  }

  proxyReq.setHeader('X-User-Id', user.id);
  proxyReq.setHeader('X-User-Role', user.role);
  proxyReq.setHeader('X-User-Email', user.email);
}

export function applyTrustedHeadersToIncomingRequest(req: IncomingMessage, user: AuthenticatedUser) {
  req.headers['x-user-id'] = user.id;
  req.headers['x-user-role'] = user.role;
  req.headers['x-user-email'] = user.email;
  req.headers[env.TRUSTED_GATEWAY_HEADER.toLowerCase()] = env.TRUSTED_GATEWAY_SECRET;
  (req as UserAwareRequest).user = user;
}

export function stripIdentityHeadersFromIncomingRequest(req: IncomingMessage) {
  for (const headerName of identityHeaderNames(env.TRUSTED_GATEWAY_HEADER)) {
    delete req.headers[headerName.toLowerCase()];
  }
}
