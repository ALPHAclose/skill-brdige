/**
 * Redis keys/channels used by the Socket.IO phase.
 *
 * Note: only the online-presence collection is required by the assignment,
 * but additional pub-sub channels are needed for cross-instance event delivery.
 */

export const onlineUsersSetKey = 'online_users';

export function onlineUserSocketCountKey(userId: string) {
  return `online_user_sockets:${userId}`;
}

export const onlineCountChannel = 'skillbridge:socket:online_count';
export const notificationNewChannel = 'skillbridge:socket:notification_new';
export const courseEnrolledChannel = 'skillbridge:socket:course_enrolled';

