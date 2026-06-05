import type { Notification, User } from '@prisma/client';

export function serializeUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

export function serializeNotification(notification: Notification) {
  return {
    id: notification.id,
    userId: notification.userId,
    title: notification.title,
    message: notification.message,
    isRead: notification.isRead,
    metadata: notification.metadata,
    createdAt: notification.createdAt,
    updatedAt: notification.updatedAt
  };
}
