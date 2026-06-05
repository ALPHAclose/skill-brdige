import { Role } from '@prisma/client';

import { prisma } from '../../lib/prisma';
import { HttpError } from '../../utils/httpError';
import { hashPassword, verifyPassword } from '../../utils/password';
import { serializeUser } from '../../utils/serialize';
import {
  blacklistAccessToken,
  extractBearerToken,
  issueTokenPair,
  revokeRefreshToken,
  rotateRefreshToken
} from '../../utils/tokenStore';
import type { LoginInput, RegisterInput } from './auth.schemas';

export async function register(input: RegisterInput) {
  const existingUser = await prisma.user.findUnique({
    where: {
      email: input.email
    }
  });

  if (existingUser) {
    throw new HttpError(409, 'A user with this email already exists');
  }

  const passwordHash = await hashPassword(input.password);
  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      role: input.role ?? Role.STUDENT
    }
  });

  const tokens = await issueTokenPair(user);

  return {
    user: serializeUser(user),
    tokens
  };
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({
    where: {
      email: input.email
    }
  });

  if (!user || !user.isActive) {
    throw new HttpError(401, 'Invalid email or password');
  }

  const isPasswordValid = await verifyPassword(input.password, user.passwordHash);

  if (!isPasswordValid) {
    throw new HttpError(401, 'Invalid email or password');
  }

  const tokens = await issueTokenPair(user);

  return {
    user: serializeUser(user),
    tokens
  };
}

export async function refresh(refreshToken: string) {
  const payloadUser = await findUserFromRefreshToken(refreshToken);
  const tokens = await rotateRefreshToken(refreshToken, payloadUser);

  return {
    user: serializeUser(payloadUser),
    tokens
  };
}

export async function logout(accessHeader: string | undefined, refreshToken?: string) {
  const accessToken = extractBearerToken(accessHeader);

  await blacklistAccessToken(accessToken);

  if (refreshToken) {
    await revokeRefreshToken(refreshToken);
  }
}

export async function me(userId: string) {
  const user = await prisma.user.findUnique({
    where: {
      id: userId
    }
  });

  if (!user || !user.isActive) {
    throw new HttpError(404, 'User not found');
  }

  return serializeUser(user);
}

async function findUserFromRefreshToken(refreshToken: string) {
  const { verifyRefreshToken, getRefreshTokenRecord } = await import('../../utils/tokenStore');
  const payload = verifyRefreshToken(refreshToken);
  const record = await getRefreshTokenRecord(payload.jti);

  if (!record) {
    throw new HttpError(401, 'Refresh token is no longer valid');
  }

  const user = await prisma.user.findUnique({
    where: {
      id: record.userId
    }
  });

  if (!user || !user.isActive) {
    throw new HttpError(401, 'Refresh token user is no longer active');
  }

  return user;
}
