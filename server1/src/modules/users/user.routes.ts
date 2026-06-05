import { Role } from '@prisma/client';
import { Router } from 'express';

import { requireRole } from '../../middleware/requireRole';
import { validate } from '../../middleware/validate';
import * as userController from './user.controller';
import { createUserSchema, listUsersQuerySchema, updateUserSchema, userIdParamsSchema } from './user.schemas';

export const userRoutes = Router();

/**
 * @openapi
 * /users:
 *   get:
 *     tags:
 *       - Users
 *     summary: List users
 *     security:
 *       - gatewayUser: []
 *     responses:
 *       200:
 *         description: User list
 */
userRoutes.get('/', requireRole(Role.ADMIN), validate({ query: listUsersQuerySchema }), userController.listUsers);

/**
 * @openapi
 * /users/{id}:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get user by id
 *     security:
 *       - gatewayUser: []
 *     responses:
 *       200:
 *         description: User details
 */
userRoutes.get('/:id', validate({ params: userIdParamsSchema }), userController.getUserById);

/**
 * @openapi
 * /users:
 *   post:
 *     tags:
 *       - Users
 *     summary: Create user
 *     security:
 *       - gatewayUser: []
 *     responses:
 *       201:
 *         description: User created
 */
userRoutes.post('/', requireRole(Role.ADMIN), validate({ body: createUserSchema }), userController.createUser);

/**
 * @openapi
 * /users/{id}:
 *   put:
 *     tags:
 *       - Users
 *     summary: Update user
 *     security:
 *       - gatewayUser: []
 *     responses:
 *       200:
 *         description: User updated
 */
userRoutes.put('/:id', validate({ params: userIdParamsSchema, body: updateUserSchema }), userController.updateUser);

/**
 * @openapi
 * /users/{id}:
 *   delete:
 *     tags:
 *       - Users
 *     summary: Deactivate user
 *     security:
 *       - gatewayUser: []
 *     responses:
 *       200:
 *         description: User deactivated
 */
userRoutes.delete('/:id', requireRole(Role.ADMIN), validate({ params: userIdParamsSchema }), userController.deleteUser);
