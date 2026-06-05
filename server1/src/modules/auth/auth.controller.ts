import type { RequestHandler } from 'express';

import { asyncHandler } from '../../utils/asyncHandler';
import * as authService from './auth.service';

export const register: RequestHandler = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);

  res.status(201).json({
    success: true,
    data: result
  });
});

export const login: RequestHandler = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);

  res.status(200).json({
    success: true,
    data: result
  });
});

export const refresh: RequestHandler = asyncHandler(async (req, res) => {
  const result = await authService.refresh(req.body.refreshToken);

  res.status(200).json({
    success: true,
    data: result
  });
});

export const logout: RequestHandler = asyncHandler(async (req, res) => {
  await authService.logout(req.header('Authorization'), req.body.refreshToken);

  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});

export const me: RequestHandler = asyncHandler(async (req, res) => {
  const user = await authService.me(req.user!.id);

  res.status(200).json({
    success: true,
    data: {
      user
    }
  });
});
