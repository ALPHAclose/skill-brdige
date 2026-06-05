import swaggerJSDoc from 'swagger-jsdoc';

import { env } from './env';

export const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SkillBridge Server1 API',
      version: '1.0.0',
      description: 'Authentication, user management, and notification REST API'
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}`,
        description: 'Server1 direct development URL'
      }
    ],
    components: {
      securitySchemes: {
        gatewayUser: {
          type: 'apiKey',
          in: 'header',
          name: 'X-User-Id',
          description: 'Trusted identity headers are forwarded by the API Gateway after JWT verification.'
        }
      },
      schemas: {
        Role: {
          type: 'string',
          enum: ['ADMIN', 'INSTRUCTOR', 'STUDENT']
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            firstName: { type: 'string', nullable: true },
            lastName: { type: 'string', nullable: true },
            role: { $ref: '#/components/schemas/Role' },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Notification: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            message: { type: 'string' },
            isRead: { type: 'boolean' },
            metadata: { type: 'object', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                message: { type: 'string' },
                statusCode: { type: 'number' },
                requestId: { type: 'string' }
              }
            }
          }
        }
      }
    }
  },
  apis: ['src/modules/**/*.routes.ts']
});
