import type { Role, Notification } from '@prisma/client';

export type SocketUser = {
  userId: string;
  role: Role;
  email: string;
};

export type SocketData = {
  user: SocketUser;
};

export type SerializedNotification = {
  id: Notification['id'];
  userId: Notification['userId'];
  title: Notification['title'];
  message: Notification['message'];
  isRead: Notification['isRead'];
  metadata: Notification['metadata'];
  createdAt: Notification['createdAt'];
  updatedAt: Notification['updatedAt'];
};

export type ClientToServerEvents = {
  /**
   * Client requests marking one of its notifications as read.
   */
  'notification:markRead': (
    payload: { notificationId: string },
    ack?: (response: { success: true; notification: SerializedNotification } | { success: false; message: string }) => void
  ) => void;

  /**
   * Lightweight presence heartbeat. Used to confirm the socket is alive.
   */
  'presence:ping': (ack?: (response: { onlineCount: number }) => void) => void;
};

export type ServerToClientEvents = {
  'notification:new': (notification: SerializedNotification) => void;
  'notification:read': (notification: SerializedNotification) => void;

  'online:update': (data: { onlineCount: number }) => void;

  /**
   * Forwarded from course/other services via Redis pub-sub.
   * (Course logic itself is out of scope for this phase.)
   */
  'course:enrolled': (payload: { userId?: string; role?: Role; courseId?: string; [key: string]: unknown }) => void;
};

export type InterServerEvents = Record<string, never>;

