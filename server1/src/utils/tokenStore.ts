import { createHash, randomUUID } from 'node:crypto';

import type { Role } from '@prisma/client';
import jwt, { type JwtPayload, type SignOptions } from 'jsonwebtoken';

import { env } from '../config/env';
import { redisClient } from '../lib/redis';
import { HttpError } from './httpError';

export type TokenUser = {
  id: string;
  email: string;
  role: Role;
};

type RefreshTokenRecord = {
  userId: string;
  email: string;
  role: Role;
  tokenHash: string;
};

type SkillBridgeJwtPayload = JwtPayload & {
  userId?: string;
  email?: string;
  role?: Role;
  type?: 'access' | 'refresh';
};

const refreshTokenPrefix = 'refresh_token';
const blacklistPrefix = 'token_blacklist';

export async function issueTokenPair(user: TokenUser) {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  const refreshPayload = verifyRefreshToken(refreshToken);

  await storeRefreshToken(refreshPayload.jti, {
    userId: user.id,
    email: user.email,
    role: user.role,
    tokenHash: hashToken(refreshToken)
  });

  return {
    accessToken,
    refreshToken,
    tokenType: 'Bearer',
    expiresIn: env.JWT_ACCESS_EXPIRES_IN
  };
}

export function signAccessToken(user: TokenUser) {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      type: 'access'
    },
    env.JWT_SECRET,
    {
      subject: user.id,
      jwtid: randomUUID(),
      expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions['expiresIn']
    }
  );
}

export function signRefreshToken(user: TokenUser) {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      type: 'refresh'
    },
    env.JWT_SECRET,
    {
      subject: user.id,
      jwtid: randomUUID(),
      expiresIn: env.JWT_REFRESH_EXPIRES_IN as SignOptions['expiresIn']
    }
  );
}

export function verifyRefreshToken(token: string) {
  let decoded: string | JwtPayload;

  try {
    decoded = jwt.verify(token, env.JWT_SECRET);
  } catch {
    throw new HttpError(401, 'Invalid or expired refresh token');
  }

  if (typeof decoded === 'string') {
    throw new HttpError(401, 'Invalid refresh token payload');
  }

  const payload = decoded as SkillBridgeJwtPayload;

  if (payload.type !== 'refresh' || !payload.sub || !payload.jti || !payload.email || !payload.role) {
    throw new HttpError(401, 'Refresh token is missing required claims');
  }

  return {
    userId: payload.sub,
    email: payload.email,
    role: payload.role,
    jti: payload.jti
  };
}

export async function getRefreshTokenRecord(jti: string) {
  const value = await redisClient.get(refreshTokenKey(jti));

  if (!value) {
    return null;
  }

  return JSON.parse(value) as RefreshTokenRecord;
}

export async function revokeRefreshToken(token: string) {
  try {
    const payload = verifyRefreshToken(token);
    await redisClient.del(refreshTokenKey(payload.jti));
  } catch {
    return;
  }
}

export async function rotateRefreshToken(token: string, user: TokenUser) {
  const payload = verifyRefreshToken(token);
  const record = await getRefreshTokenRecord(payload.jti);

  if (!record || record.tokenHash !== hashToken(token) || record.userId !== user.id) {
    throw new HttpError(401, 'Refresh token is no longer valid');
  }

  await redisClient.del(refreshTokenKey(payload.jti));

  return issueTokenPair(user);
}

export async function blacklistAccessToken(token: string | null) {
  if (!token) {
    return;
  }

  const decoded = jwt.decode(token) as SkillBridgeJwtPayload | null;

  if (!decoded?.jti || !decoded.exp) {
    return;
  }

  const ttlSeconds = decoded.exp - Math.floor(Date.now() / 1000);

  if (ttlSeconds > 0) {
    await redisClient.setEx(blacklistKey(decoded.jti), ttlSeconds, '1');
  }
}

export async function isAccessTokenBlacklisted(jti: string) {
  return (await redisClient.exists(blacklistKey(jti))) === 1;
}

export function extractBearerToken(authorizationHeader: string | undefined) {
  if (!authorizationHeader?.startsWith('Bearer ')) {
    return null;
  }

  return authorizationHeader.slice('Bearer '.length).trim();
}

export function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

async function storeRefreshToken(jti: string, record: RefreshTokenRecord) {
  await redisClient.setEx(refreshTokenKey(jti), parseExpiresInToSeconds(env.JWT_REFRESH_EXPIRES_IN), JSON.stringify(record));
}

function refreshTokenKey(jti: string) {
  return `${refreshTokenPrefix}:${jti}`;
}

function blacklistKey(jti: string) {
  return `${blacklistPrefix}:${jti}`;
}

function parseExpiresInToSeconds(value: string) {
  const match = /^(\d+)([smhd])$/.exec(value);

  if (!match) {
    throw new Error(`Unsupported expiration format: ${value}`);
  }

  const amount = Number(match[1]);
  const unit = match[2];

  switch (unit) {
    case 's':
      return amount;
    case 'm':
      return amount * 60;
    case 'h':
      return amount * 60 * 60;
    case 'd':
      return amount * 60 * 60 * 24;
    default:
      return amount;
  }
}
