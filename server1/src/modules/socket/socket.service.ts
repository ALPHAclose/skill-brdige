/**
 * socket.service.ts
 *
 * Thin helpers that let other server1 modules push events to connected clients
 * without importing socket.io directly.
 *
 * The `io` instance is injected via setSocketIO() called from lib/socketio.ts
 * after the server is created, which breaks the circular import that would arise
 * from importing getIO() from lib/socketio.ts (since that module already imports
 * socket.handlers.ts, which imports notification.service.ts, which imports here).
 */

import type { Server } from 'socket.io';
import type { Role } from '@prisma/client';

import type { ClientToServerEvents, InterServerEvents, SerializedNotification, ServerToClientEvents, SocketData } from './socket.types';

type AppIO = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

let _io: AppIO | null = null;

/** Called once from lib/socketio.ts after the Server instance is created. */
export function setSocketIO(io: AppIO): void {
  _io = io;
}

/**
 * Emit a `notification:new` event to a specific user's private room.
 * Called by the notification service after writing to the DB.
 */
export function emitNotification(userId: string, notification: SerializedNotification): void {
  if (!_io) {
    // Socket.IO may not be initialised in test/integration environments.
    return;
  }

  _io.to(`user:${userId}`).emit('notification:new', notification);
}

/**
 * Emit a `course:enrolled` event to a role room (e.g. `role:STUDENT`).
 */
export function emitCourseEvent(
  role: string,
  payload: { userId?: string; role?: Role; courseId?: string; [key: string]: unknown }
): void {
  if (!_io) {
    return;
  }

  _io.to(`role:${role}`).emit('course:enrolled', payload);
}

/**
 * Returns the IDs of all currently online users from the Redis-backed
 * online presence set.
 */
export async function getOnlineUserIds(): Promise<string[]> {
  const { onlineUsersSetKey } = await import('./redisKeys');
  const { redisClient } = await import('../../lib/redis');

  return redisClient.sMembers(onlineUsersSetKey);
}
