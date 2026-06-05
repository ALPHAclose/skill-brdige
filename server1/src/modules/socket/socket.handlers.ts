import { randomUUID } from 'node:crypto';
import { createClient, type RedisClientType } from 'redis';
import { Server } from 'socket.io';
import { z } from 'zod';

import { env } from '../../config/env';
import { getOnlineCount, publishOnlineCount, addUserToOnlineSet, removeUserFromOnlineSet } from './onlinePresence';
import { courseEnrolledChannel, notificationNewChannel, onlineCountChannel } from './redisKeys';
import type { ClientToServerEvents, InterServerEvents, ServerToClientEvents, SocketData, SerializedNotification } from './socket.types';
import * as notificationService from '../notifications/notification.service';

const markReadPayloadSchema = z.object({
  notificationId: z.string().uuid()
});

let redisSubscriberStarted = false;

async function startRedisSubscriber(io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>, instanceId: string) {
  if (redisSubscriberStarted) return;
  redisSubscriberStarted = true;

  const subClient: RedisClientType = createClient({ url: env.REDIS_URL });

  await subClient.connect();

  await subClient.subscribe(onlineCountChannel, (raw) => {
    try {
      const parsed = JSON.parse(raw) as { instanceId: string; onlineCount: number };
      if (parsed.instanceId === instanceId) return; // local emission already happened
      io.emit('online:update', { onlineCount: parsed.onlineCount });
    } catch {
      // Ignore malformed pub-sub messages
    }
  });

  await subClient.subscribe(notificationNewChannel, (raw) => {
    try {
      const payload = JSON.parse(raw) as SerializedNotification;
      if (!payload?.userId) return;
      io.to(`user:${payload.userId}`).emit('notification:new', payload);
    } catch {
      // Ignore malformed pub-sub messages
    }
  });

  await subClient.subscribe(courseEnrolledChannel, (raw) => {
    try {
      const payload = JSON.parse(raw) as { userId?: string; role?: SocketData['user']['role']; [key: string]: unknown };

      if (payload.userId) {
        io.to(`user:${payload.userId}`).emit('course:enrolled', payload);
        return;
      }

      if (payload.role) {
        io.to(`role:${payload.role}`).emit('course:enrolled', payload);
        return;
      }

      io.emit('course:enrolled', payload);
    } catch {
      // Ignore malformed pub-sub messages
    }
  });

  // Simplified microservice integration subscriptions
  await subClient.subscribe('notification:send', async (raw) => {
    try {
      const payload = JSON.parse(raw) as { userId: string; title: string; message: string; metadata?: Record<string, unknown> };
      if (!payload?.userId) return;
      await notificationService.createNotification(payload.userId, {
        title: payload.title,
        message: payload.message,
        metadata: payload.metadata
      });
    } catch (err) {
      console.error('[Socket.IO Redis subscriber] Error handling notification:send', err);
    }
  });

  await subClient.subscribe('course:enrolled', (raw) => {
    try {
      const payload = JSON.parse(raw) as { userId?: string; role?: SocketData['user']['role']; [key: string]: unknown };

      if (payload.userId) {
        io.to(`user:${payload.userId}`).emit('course:enrolled', payload);
        return;
      }

      if (payload.role) {
        io.to(`role:${payload.role}`).emit('course:enrolled', payload);
        return;
      }

      io.emit('course:enrolled', payload);
    } catch {
      // Ignore malformed pub-sub messages
    }
  });

  subClient.on('error', (err) => console.error('[Socket.IO Redis subscriber] error', err));
}

export function registerSocketHandlers(io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>) {
  const instanceId = randomUUID();

  void startRedisSubscriber(io, instanceId).catch((err) => {
    console.error('[Socket.IO] Failed to start Redis subscriber', err);
  });

  io.on('connection', async (socket) => {
    const user = socket.data.user;
    if (!user) {
      // Should be blocked by authenticateSocket middleware, but keep a safety guard.
      socket.disconnect(true);
      return;
    }

    const { userId, role } = user;

    // Join per-user and per-role rooms.
    socket.join(`user:${userId}`);
    socket.join(`role:${role}`);

    // Online presence tracking
    const { onlineCount } = await addUserToOnlineSet(userId);

    io.emit('online:update', { onlineCount });
    await publishOnlineCount(instanceId, onlineCount);

    socket.on('presence:ping', async (ack) => {
      const onlineCountNow = await getOnlineCount();
      ack?.({ onlineCount: onlineCountNow });
    });

    socket.on('notification:markRead', async (payload, ack) => {
      const parsed = markReadPayloadSchema.safeParse(payload);
      if (!parsed.success) {
        ack?.({ success: false, message: 'Invalid notificationId' });
        return;
      }

      try {
        const updatedNotification = await notificationService.markNotificationAsRead(userId, parsed.data.notificationId);
        io.to(`user:${userId}`).emit('notification:read', updatedNotification);
        ack?.({ success: true, notification: updatedNotification });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to mark notification as read';
        ack?.({ success: false, message });
      }
    });

    socket.on('disconnect', async () => {
      try {
        const { onlineCount } = await removeUserFromOnlineSet(userId);
        io.emit('online:update', { onlineCount });
        await publishOnlineCount(instanceId, onlineCount);
      } catch (err) {
        console.error('[Socket.IO] Failed to update online presence on disconnect', err);
      }
    });
  });
}

