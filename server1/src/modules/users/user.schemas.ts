import { z } from 'zod';

export const userIdParamsSchema = z.object({
  id: z.string().uuid()
});

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  role: z.enum(['ADMIN', 'INSTRUCTOR', 'STUDENT']).optional(),
  search: z.string().trim().min(1).max(100).optional()
});

export const createUserSchema = z.object({
  email: z.string().email().trim().toLowerCase(),
  password: z.string().min(8).max(128),
  firstName: z.string().trim().min(1).max(100).optional(),
  lastName: z.string().trim().min(1).max(100).optional(),
  role: z.enum(['ADMIN', 'INSTRUCTOR', 'STUDENT']).default('STUDENT'),
  isActive: z.boolean().optional()
});

export const updateUserSchema = z
  .object({
    email: z.string().email().trim().toLowerCase().optional(),
    password: z.string().min(8).max(128).optional(),
    firstName: z.string().trim().min(1).max(100).nullable().optional(),
    lastName: z.string().trim().min(1).max(100).nullable().optional(),
    role: z.enum(['ADMIN', 'INSTRUCTOR', 'STUDENT']).optional(),
    isActive: z.boolean().optional()
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required'
  });

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
