import { z } from 'zod';

export const notificationIdParamsSchema = z.object({
  id: z.string().uuid()
});

export const listNotificationsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  isRead: z.enum(['true', 'false']).transform((value) => value === 'true').optional()
});

export const createNotificationSchema = z.object({
  title: z.string().min(1).max(255),
  message: z.string().min(1).max(2000),
  metadata: z.record(z.unknown()).optional()
});

export type ListNotificationsQuery = z.infer<typeof listNotificationsQuerySchema>;
export type CreateNotificationBody = z.infer<typeof createNotificationSchema>;

