import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email().trim().toLowerCase(),
  password: z.string().min(8).max(128),
  firstName: z.string().trim().min(1).max(100).optional(),
  lastName: z.string().trim().min(1).max(100).optional(),
  role: z.enum(['INSTRUCTOR', 'STUDENT']).optional()
});

export const loginSchema = z.object({
  email: z.string().email().trim().toLowerCase(),
  password: z.string().min(1).max(128)
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1)
});

export const logoutSchema = z.object({
  refreshToken: z.string().min(1).optional()
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
export type LogoutInput = z.infer<typeof logoutSchema>;
