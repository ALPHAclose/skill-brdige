import type { RequestHandler } from 'express';

import { asyncHandler } from '../../utils/asyncHandler';
import type { ListNotificationsQuery } from './notification.schemas';
import * as notificationService from './notification.service';

export const listNotifications: RequestHandler = asyncHandler(async (req, res) => {
  const result = await notificationService.listNotifications(req.user!.id, req.query as unknown as ListNotificationsQuery);

  res.status(200).json({
    success: true,
    data: result
  });
});

export const markNotificationAsRead: RequestHandler = asyncHandler(async (req, res) => {
  const notification = await notificationService.markNotificationAsRead(req.user!.id, req.params.id);

  res.status(200).json({
    success: true,
    data: {
      notification
    }
  });
});

export const deleteNotification: RequestHandler = asyncHandler(async (req, res) => {
  await notificationService.deleteNotification(req.user!.id, req.params.id);

  res.status(200).json({
    success: true,
    message: 'Notification deleted successfully'
  });
});
