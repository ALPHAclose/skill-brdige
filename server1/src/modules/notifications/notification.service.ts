import type { Prisma } from '@prisma/client';

import { prisma } from '../../lib/prisma';
import { HttpError } from '../../utils/httpError';
import { serializeNotification } from '../../utils/serialize';
import { emitNotification } from '../socket/socket.service';
import type { ListNotificationsQuery, CreateNotificationBody } from './notification.schemas';

export async function createNotification(userId: string, data: CreateNotificationBody) {
  const notification = await prisma.notification.create({
    data: {
      userId,
      title: data.title,
      message: data.message,
      ...(data.metadata !== undefined ? { metadata: data.metadata as Prisma.InputJsonValue } : {})
    }
  });

  const serialized = serializeNotification(notification);

  // Push to connected clients in real-time
  emitNotification(userId, serialized);

  return serialized;
}

export async function listNotifications(userId: string, query: ListNotificationsQuery) {
  const where: Prisma.NotificationWhereInput = {
    userId,
    ...(typeof query.isRead === 'boolean' ? { isRead: query.isRead } : {})
  };

  const skip = (query.page - 1) * query.limit;

  const [notifications, total] = await prisma.$transaction([
    prisma.notification.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: query.limit
    }),
    prisma.notification.count({ where })
  ]);

  return {
    items: notifications.map(serializeNotification),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      pages: Math.ceil(total / query.limit)
    }
  };
}

export async function markNotificationAsRead(userId: string, notificationId: string) {
  const notification = await prisma.notification.findFirst({
    where: {
      id: notificationId,
      userId
    }
  });

  if (!notification) {
    throw new HttpError(404, 'Notification not found');
  }

  const updatedNotification = await prisma.notification.update({
    where: {
      id: notificationId
    },
    data: {
      isRead: true
    }
  });

  const serialized = serializeNotification(updatedNotification);

  // Notify user's other connected tabs/devices
  emitNotification(userId, serialized);

  return serialized;
}

export async function deleteNotification(userId: string, notificationId: string) {
  const notification = await prisma.notification.findFirst({
    where: {
      id: notificationId,
      userId
    }
  });

  if (!notification) {
    throw new HttpError(404, 'Notification not found');
  }

  await prisma.notification.delete({
    where: {
      id: notificationId
    }
  });
}
