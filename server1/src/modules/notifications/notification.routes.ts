import { Router } from 'express';

import { validate } from '../../middleware/validate';
import * as notificationController from './notification.controller';
import { listNotificationsQuerySchema, notificationIdParamsSchema } from './notification.schemas';

export const notificationRoutes = Router();

/**
 * @openapi
 * /notifications:
 *   get:
 *     tags:
 *       - Notifications
 *     summary: List current user's notifications
 *     security:
 *       - gatewayUser: []
 *     responses:
 *       200:
 *         description: Notification list
 */
notificationRoutes.get('/', validate({ query: listNotificationsQuerySchema }), notificationController.listNotifications);

/**
 * @openapi
 * /notifications/{id}/read:
 *   put:
 *     tags:
 *       - Notifications
 *     summary: Mark notification as read
 *     security:
 *       - gatewayUser: []
 *     responses:
 *       200:
 *         description: Notification marked as read
 */
notificationRoutes.put(
  '/:id/read',
  validate({ params: notificationIdParamsSchema }),
  notificationController.markNotificationAsRead
);

/**
 * @openapi
 * /notifications/{id}:
 *   delete:
 *     tags:
 *       - Notifications
 *     summary: Delete notification
 *     security:
 *       - gatewayUser: []
 *     responses:
 *       200:
 *         description: Notification deleted
 */
notificationRoutes.delete('/:id', validate({ params: notificationIdParamsSchema }), notificationController.deleteNotification);
