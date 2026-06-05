import { Router } from 'express';

import { requireTrustedGatewayUser } from '../../middleware/requireTrustedGatewayUser';
import { validate } from '../../middleware/validate';
import * as authController from './auth.controller';
import { loginSchema, logoutSchema, refreshSchema, registerSchema } from './auth.schemas';

export const authRoutes = Router();

/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Register a new student or instructor
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 8 }
 *               firstName: { type: string }
 *               lastName: { type: string }
 *               role: { type: string, enum: [INSTRUCTOR, STUDENT] }
 *     responses:
 *       201:
 *         description: Registered successfully
 */
authRoutes.post('/register', validate({ body: registerSchema }), authController.register);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Login with email and password
 *     responses:
 *       200:
 *         description: Login successful
 */
authRoutes.post('/login', validate({ body: loginSchema }), authController.login);

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Logout and revoke tokens
 *     security:
 *       - gatewayUser: []
 *     responses:
 *       200:
 *         description: Logout successful
 */
authRoutes.post('/logout', requireTrustedGatewayUser, validate({ body: logoutSchema }), authController.logout);

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Rotate refresh token and return a new token pair
 *     responses:
 *       200:
 *         description: Refresh successful
 */
authRoutes.post('/refresh', validate({ body: refreshSchema }), authController.refresh);

/**
 * @openapi
 * /auth/me:
 *   get:
 *     tags:
 *       - Auth
 *     summary: Return current authenticated user
 *     security:
 *       - gatewayUser: []
 *     responses:
 *       200:
 *         description: Current user
 */
authRoutes.get('/me', requireTrustedGatewayUser, authController.me);
