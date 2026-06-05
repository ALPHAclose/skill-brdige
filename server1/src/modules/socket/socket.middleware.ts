import { Role } from '@prisma/client';
import type { Socket } from 'socket.io';

import { env } from '../../config/env';
import type { ClientToServerEvents, InterServerEvents, ServerToClientEvents, SocketData } from './socket.types';

const roleValues = new Set<string>(Object.values(Role));

function getHeaderValue(headers: Record<string, string | string[] | undefined>, name: string) {
  const value = headers[name.toLowerCase()];
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

export function authenticateSocket(
  socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
  next: (err?: Error) => void
) {
  const trustedGatewayHeader = env.TRUSTED_GATEWAY_HEADER.toLowerCase();
  const trustedSecret = getHeaderValue(socket.handshake.headers, trustedGatewayHeader);

  if (trustedSecret !== env.TRUSTED_GATEWAY_SECRET) {
    next(new Error('Socket connection did not come from the trusted API Gateway'));
    return;
  }

  const userId = getHeaderValue(socket.handshake.headers, 'x-user-id');
  const email = getHeaderValue(socket.handshake.headers, 'x-user-email');
  const roleValue = getHeaderValue(socket.handshake.headers, 'x-user-role');

  if (!userId || !email || !roleValue) {
    next(new Error('Missing trusted user headers'));
    return;
  }

  if (!roleValues.has(roleValue)) {
    next(new Error('Unsupported user role'));
    return;
  }

  socket.data.user = {
    userId,
    email,
    role: roleValue as Role
  };

  next();
}

