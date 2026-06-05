import type { IncomingHttpHeaders } from 'node:http';

import jwt, { type JwtPayload } from 'jsonwebtoken';

import { env } from '../config/env';
import { USER_ROLES, type UserRole } from '../constants/roles';
import { HttpError } from './httpError';

export type AuthenticatedUser = {
  id: string;
  role: UserRole;
  email: string;
};

type SkillBridgeJwtPayload = JwtPayload & {
  id?: string;
  userId?: string;
  role?: string;
  email?: string;
};

const allowedRoles = new Set<string>(USER_ROLES);

export function verifyAccessTokenFromRequest(request: { headers: IncomingHttpHeaders; url?: string }) {
  const token = getTokenFromRequest(request);

  if (!token) {
    throw new HttpError(401, 'Missing bearer token');
  }

  let decoded: string | JwtPayload;

  try {
    decoded = jwt.verify(token, env.JWT_SECRET);
  } catch {
    throw new HttpError(401, 'Invalid or expired token');
  }

  if (typeof decoded === 'string') {
    throw new HttpError(401, 'Invalid token payload');
  }

  return normalizeJwtPayload(decoded as SkillBridgeJwtPayload);
}

function getTokenFromRequest(request: { headers: IncomingHttpHeaders; url?: string }) {
  const authorization = request.headers.authorization;

  if (authorization?.startsWith('Bearer ')) {
    return authorization.slice('Bearer '.length).trim();
  }

  return getTokenFromUrl(request.url);
}

function getTokenFromUrl(url?: string) {
  if (!url) {
    return null;
  }

  const parsedUrl = new URL(url, 'http://gateway.local');

  return parsedUrl.searchParams.get('access_token') ?? parsedUrl.searchParams.get('token');
}

function normalizeJwtPayload(payload: SkillBridgeJwtPayload): AuthenticatedUser {
  const id = payload.sub ?? payload.userId ?? payload.id;
  const { role, email } = payload;

  if (!id || !role || !email) {
    throw new HttpError(401, 'Token is missing required user claims');
  }

  if (!allowedRoles.has(role)) {
    throw new HttpError(403, 'Token contains an unsupported role');
  }

  return {
    id,
    role: role as UserRole,
    email
  };
}
