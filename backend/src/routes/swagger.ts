import swaggerUI from 'swagger-ui-express';
import { Router } from 'express';

const router = Router();

const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Feature Flags API',
    version: '1.0.0',
    description: 'Dynamic feature flag management platform with role-based access control',
    contact: {
      name: 'Feature Flags Team',
      url: 'http://localhost:3000',
    },
  },
  servers: [
    {
      url: 'http://localhost:4000',
      description: 'Development server',
    },
    {
      url: 'https://api.featureflags.io',
      description: 'Production server',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      ServiceToken: {
        type: 'apiKey',
        in: 'header',
        name: 'Authorization',
        description: 'Service token for evaluation API',
      },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email' },
          role: { type: 'string', enum: ['viewer', 'editor', 'admin'] },
          status: { type: 'string', enum: ['pending', 'approved', 'rejected'] },
          requestedRole: { type: 'string', enum: ['viewer', 'editor'] },
          createdAt: { type: 'string', format: 'date-time' },
          approvedAt: { type: 'string', format: 'date-time' },
        },
      },
      Flag: {
        type: 'object',
        properties: {
          key: { type: 'string' },
          type: { type: 'string', enum: ['boolean', 'multivariate', 'json'] },
          description: { type: 'string' },
          environments: {
            type: 'object',
            additionalProperties: {
              type: 'object',
            },
          },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      AuditLog: {
        type: 'object',
        properties: {
          ts: { type: 'number', description: 'Unix timestamp in milliseconds' },
          actor: { type: 'string', description: 'User email or service name' },
          entityType: { type: 'string', enum: ['flag', 'user', 'config'] },
          entityId: { type: 'string' },
          action: { type: 'string', enum: ['create', 'update', 'delete', 'rollback', 'approve', 'reject'] },
          data: { type: 'object' },
        },
      },
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string' },
        },
      },
    },
  },
  paths: {
    '/api/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Login with email and password',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    token: { type: 'string' },
                    user: { $ref: '#/components/schemas/User' },
                  },
                },
              },
            },
          },
          401: {
            description: 'Invalid credentials',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          403: {
            description: 'Account not approved',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/api/auth/signup': {
      post: {
        tags: ['Authentication'],
        summary: 'Create a new account (pending approval)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 6 },
                  requestedRole: { type: 'string', enum: ['viewer', 'editor'] },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Account created, pending admin approval',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                    user: { $ref: '#/components/schemas/User' },
                  },
                },
              },
            },
          },
          400: {
            description: 'Missing credentials',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          409: {
            description: 'Email already in use',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/api/auth/google': {
      post: {
        tags: ['Authentication'],
        summary: 'Login/signup with Google ID token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['idToken'],
                properties: {
                  idToken: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Login successful',
          },
          201: {
            description: 'Account created, pending approval',
          },
        },
      },
    },
    '/api/auth/me': {
      get: {
        tags: ['Authentication'],
        summary: 'Get current user info',
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: 'Current user',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    user: {
                      type: 'object',
                      properties: {
                        sub: { type: 'string' },
                        email: { type: 'string' },
                        role: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
          401: {
            description: 'Unauthorized',
          },
        },
      },
    },
    '/api/auth/users/pending': {
      get: {
        tags: ['Admin'],
        summary: 'List pending user approvals',
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: 'Pending users',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    users: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/User' },
                    },
                  },
                },
              },
            },
          },
          403: {
            description: 'Insufficient permissions',
          },
        },
      },
    },
    '/api/auth/users/{userId}/approve': {
      post: {
        tags: ['Admin'],
        summary: 'Approve or reject pending user',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'userId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['approve'],
                properties: {
                  approve: { type: 'boolean' },
                  role: { type: 'string', enum: ['viewer', 'editor', 'admin'] },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'User approved/rejected',
          },
          403: {
            description: 'Insufficient permissions',
          },
        },
      },
    },
    '/api/manage/flags': {
      get: {
        tags: ['Flag Management'],
        summary: 'List all flags',
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: 'List of flags',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Flag' },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Flag Management'],
        summary: 'Create a new flag',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['key', 'type'],
                properties: {
                  key: { type: 'string' },
                  type: { type: 'string', enum: ['boolean', 'multivariate', 'json'] },
                  description: { type: 'string' },
                  environments: { type: 'object' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Flag created',
          },
          403: {
            description: 'Insufficient permissions',
          },
        },
      },
    },
    '/api/eval/eval': {
      post: {
        tags: ['Flag Evaluation'],
        summary: 'Evaluate a flag',
        security: [{ ServiceToken: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['key'],
                properties: {
                  key: { type: 'string' },
                  user: { type: 'object' },
                  attributes: { type: 'object' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Flag evaluation result',
          },
        },
      },
    },
    '/api/auth/audit': {
      get: {
        tags: ['Audit'],
        summary: 'Get audit logs',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'entityType',
            in: 'query',
            schema: { type: 'string', enum: ['flag', 'user', 'config'] },
          },
          {
            name: 'entityId',
            in: 'query',
            schema: { type: 'string' },
          },
          {
            name: 'actor',
            in: 'query',
            schema: { type: 'string' },
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', default: 100 },
          },
          {
            name: 'skip',
            in: 'query',
            schema: { type: 'integer', default: 0 },
          },
        ],
        responses: {
          200: {
            description: 'Audit logs',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    logs: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/AuditLog' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

router.use('/', swaggerUI.serve);
router.get('/', swaggerUI.setup(swaggerSpec));

export default router;
