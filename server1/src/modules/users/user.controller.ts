import type { RequestHandler } from 'express';

import { asyncHandler } from '../../utils/asyncHandler';
import type { ListUsersQuery } from './user.schemas';
import * as userService from './user.service';

export const listUsers: RequestHandler = asyncHandler(async (req, res) => {
  const result = await userService.listUsers(req.query as unknown as ListUsersQuery);

  res.status(200).json({
    success: true,
    data: result
  });
});

export const getUserById: RequestHandler = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.params.id, req.user!);

  res.status(200).json({
    success: true,
    data: {
      user
    }
  });
});

export const createUser: RequestHandler = asyncHandler(async (req, res) => {
  const user = await userService.createUser(req.body);

  res.status(201).json({
    success: true,
    data: {
      user
    }
  });
});

export const updateUser: RequestHandler = asyncHandler(async (req, res) => {
  const user = await userService.updateUser(req.params.id, req.body, req.user!);

  res.status(200).json({
    success: true,
    data: {
      user
    }
  });
});

export const deleteUser: RequestHandler = asyncHandler(async (req, res) => {
  const user = await userService.deleteUser(req.params.id);

  res.status(200).json({
    success: true,
    data: {
      user
    }
  });
});
