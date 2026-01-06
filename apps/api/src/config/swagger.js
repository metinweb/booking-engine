/**
 * @module config/swagger
 * @description Swagger/OpenAPI configuration for API documentation.
 */

import swaggerJsdoc from 'swagger-jsdoc'
import config from './index.js'

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Booking Engine API',
    version: '1.0.0',
    description: `
## Booking Engine REST API

Multi-tenant booking engine API for hotel reservations, property management, and partner operations.

### Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
\`\`\`
Authorization: Bearer <your_token>
\`\`\`

### Rate Limiting
- Public endpoints: 100 requests/minute
- Search endpoints: 30 requests/minute
- Login endpoints: 5 requests/15 minutes per IP+email

### Response Format
All responses follow a standard format:
\`\`\`json
{
  "success": true|false,
  "data": { ... },
  "message": "optional message",
  "pagination": { "page": 1, "limit": 20, "total": 100, "pages": 5 }
}
\`\`\`

### Error Responses
\`\`\`json
{
  "success": false,
  "message": "ERROR_CODE",
  "details": { ... }
}
\`\`\`
    `,
    contact: {
      name: 'API Support'
    },
    license: {
      name: 'Proprietary'
    }
  },
  servers: [
    {
      url: config.isDev ? `http://localhost:${config.port}` : '{serverUrl}',
      description: config.isDev ? 'Development server' : 'Production server',
      variables: config.isDev
        ? {}
        : {
            serverUrl: {
              default: 'https://api.example.com',
              description: 'Server URL'
            }
          }
    }
  ],
  tags: [
    { name: 'Auth', description: 'Authentication & authorization' },
    { name: 'Users', description: 'User management' },
    { name: 'Partners', description: 'Partner (B2B) management' },
    { name: 'Agencies', description: 'Travel agency management' },
    { name: 'Hotels', description: 'Hotel management' },
    { name: 'Bookings', description: 'Booking operations' },
    { name: 'Dashboard', description: 'Analytics & statistics' },
    { name: 'Public', description: 'Public B2C endpoints (no auth required)' },
    { name: 'PMS', description: 'Property Management System' },
    { name: 'Settings', description: 'System settings' },
    { name: 'Notifications', description: 'Notification management' }
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token obtained from /api/auth/login'
      },
      PmsAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'PMS-specific JWT token for property management'
      }
    },
    schemas: {
      // Common Response Schemas
      SuccessResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: { type: 'object' },
          message: { type: 'string' }
        }
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'ERROR_CODE' },
          details: { type: 'object' }
        }
      },
      Pagination: {
        type: 'object',
        properties: {
          page: { type: 'integer', example: 1 },
          limit: { type: 'integer', example: 20 },
          total: { type: 'integer', example: 100 },
          pages: { type: 'integer', example: 5 }
        }
      },
      // User Schemas
      User: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
          name: { type: 'string', example: 'John Doe' },
          email: { type: 'string', format: 'email', example: 'john@example.com' },
          phone: { type: 'string', example: '+905551234567' },
          role: { type: 'string', enum: ['admin', 'user', 'viewer'], example: 'admin' },
          accountType: { type: 'string', enum: ['platform', 'partner', 'agency'], example: 'partner' },
          status: { type: 'string', enum: ['active', 'inactive', 'pending'], example: 'active' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      // Partner Schemas
      Partner: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
          companyName: { type: 'string', example: 'Acme Travel' },
          email: { type: 'string', format: 'email' },
          phone: { type: 'string' },
          status: { type: 'string', enum: ['active', 'inactive', 'pending'], example: 'active' },
          createdAt: { type: 'string', format: 'date-time' }
        }
      },
      // Hotel Schemas
      Hotel: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
          name: { type: 'string', example: 'Grand Hotel' },
          code: { type: 'string', example: 'GRD001' },
          stars: { type: 'integer', minimum: 1, maximum: 5, example: 5 },
          address: {
            type: 'object',
            properties: {
              street: { type: 'string' },
              city: { type: 'string' },
              country: { type: 'string' },
              postalCode: { type: 'string' }
            }
          },
          location: {
            type: 'object',
            properties: {
              type: { type: 'string', example: 'Point' },
              coordinates: {
                type: 'array',
                items: { type: 'number' },
                example: [28.9784, 41.0082]
              }
            }
          },
          status: { type: 'string', enum: ['active', 'inactive', 'draft'], example: 'active' }
        }
      },
      // Booking Schemas
      Booking: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          bookingNumber: { type: 'string', example: 'BK-20240115-001' },
          status: {
            type: 'string',
            enum: ['pending', 'confirmed', 'cancelled', 'completed', 'no_show'],
            example: 'confirmed'
          },
          hotel: { $ref: '#/components/schemas/Hotel' },
          checkInDate: { type: 'string', format: 'date', example: '2024-06-15' },
          checkOutDate: { type: 'string', format: 'date', example: '2024-06-18' },
          nights: { type: 'integer', example: 3 },
          rooms: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                roomType: { type: 'string' },
                mealPlan: { type: 'string' },
                adults: { type: 'integer' },
                children: { type: 'integer' },
                price: { type: 'number' }
              }
            }
          },
          totalPrice: { type: 'number', example: 1500.0 },
          currency: { type: 'string', example: 'EUR' },
          leadGuest: {
            type: 'object',
            properties: {
              firstName: { type: 'string' },
              lastName: { type: 'string' },
              email: { type: 'string' },
              phone: { type: 'string' }
            }
          },
          createdAt: { type: 'string', format: 'date-time' }
        }
      },
      // Price Quote
      PriceQuote: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          pricing: {
            type: 'object',
            properties: {
              originalTotal: { type: 'number', example: 1000 },
              finalTotal: { type: 'number', example: 900 },
              totalDiscount: { type: 'number', example: 100 },
              currency: { type: 'string', example: 'EUR' },
              nightlyBreakdown: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    date: { type: 'string', format: 'date' },
                    price: { type: 'number' }
                  }
                }
              }
            }
          },
          campaigns: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                discountType: { type: 'string' },
                discountValue: { type: 'number' }
              }
            }
          }
        }
      },
      // Login Request/Response
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'admin@example.com' },
          password: { type: 'string', format: 'password', example: 'password123' },
          twoFactorToken: { type: 'string', description: '2FA token if enabled' }
        }
      },
      LoginResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string' },
          data: {
            type: 'object',
            properties: {
              user: { $ref: '#/components/schemas/User' },
              account: { type: 'object' },
              accessToken: { type: 'string' },
              refreshToken: { type: 'string' }
            }
          }
        }
      }
    },
    parameters: {
      PageParam: {
        name: 'page',
        in: 'query',
        schema: { type: 'integer', minimum: 1, default: 1 },
        description: 'Page number'
      },
      LimitParam: {
        name: 'limit',
        in: 'query',
        schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
        description: 'Items per page'
      },
      SearchParam: {
        name: 'search',
        in: 'query',
        schema: { type: 'string' },
        description: 'Search term'
      },
      StatusParam: {
        name: 'status',
        in: 'query',
        schema: { type: 'string', enum: ['active', 'inactive', 'pending', 'all'] },
        description: 'Filter by status'
      },
      IdParam: {
        name: 'id',
        in: 'path',
        required: true,
        schema: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' },
        description: 'Resource ID (MongoDB ObjectId)'
      },
      HotelIdParam: {
        name: 'hotelId',
        in: 'path',
        required: true,
        schema: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' },
        description: 'Hotel ID'
      }
    },
    responses: {
      UnauthorizedError: {
        description: 'Authentication required or invalid token',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: { success: false, message: 'UNAUTHORIZED' }
          }
        }
      },
      ForbiddenError: {
        description: 'Insufficient permissions',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: { success: false, message: 'FORBIDDEN' }
          }
        }
      },
      NotFoundError: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: { success: false, message: 'NOT_FOUND' }
          }
        }
      },
      ValidationError: {
        description: 'Validation failed',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: {
              success: false,
              message: 'VALIDATION_ERROR',
              details: { errors: [{ field: 'email', message: 'Invalid email format' }] }
            }
          }
        }
      },
      RateLimitError: {
        description: 'Rate limit exceeded',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: { success: false, message: 'TOO_MANY_REQUESTS' }
          }
        }
      }
    }
  },
  security: [{ BearerAuth: [] }]
}

const options = {
  swaggerDefinition,
  apis: [
    './src/modules/**/*.routes.js',
    './src/modules/**/*.swagger.js',
    './src/docs/**/*.js'
  ]
}

export const swaggerSpec = swaggerJsdoc(options)

export default swaggerSpec
