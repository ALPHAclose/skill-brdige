import { redisClient } from '../../lib/redis';

import { onlineCountChannel, onlineUserSocketCountKey, onlineUsersSetKey } from './redisKeys';

export async function addUserToOnlineSet(userId: string) {
  const socketCountKey = onlineUserSocketCountKey(userId);

  const socketCount = await redisClient.incr(socketCountKey);

  // First active socket for this user -> add to the online set.
  if (socketCount === 1) {
    await redisClient.sAdd(onlineUsersSetKey, userId);
  }

  const onlineCount = await redisClient.sCard(onlineUsersSetKey);

  return { onlineCount };
}

export async function removeUserFromOnlineSet(userId: string) {
  const socketCountKey = onlineUserSocketCountKey(userId);

  const socketCount = await redisClient.decr(socketCountKey);

  // If the count went to zero (or below), remove from the set.
  if (socketCount <= 0) {
    await redisClient.sRem(onlineUsersSetKey, userId);
    await redisClient.del(socketCountKey);
  }

  const onlineCount = await redisClient.sCard(onlineUsersSetKey);

  return { onlineCount };
}

export async function publishOnlineCount(instanceId: string, onlineCount: number) {
  await redisClient.publish(
    onlineCountChannel,
    JSON.stringify({ instanceId, onlineCount })
  );
}

export async function getOnlineCount() {
  return redisClient.sCard(onlineUsersSetKey);
}

