const noteSchema = {
  type: 'object',
  properties: {
    id:         { type: 'string', format: 'uuid', example: 'a1b2c3d4-...' },
    title:      { type: 'string', example: 'My Note' },
    content:    { type: 'string', example: 'Note body here' },
    category:   { type: 'string', nullable: true, example: 'work' },
    created_at: { type: 'string', format: 'date-time' },
    updated_at: { type: 'string', format: 'date-time' },
  },
};

const bearerAuth = { bearerAuth: [] };
const authHeader = {
  in: 'header', name: 'Authorization', required: true,
  schema: { type: 'string', example: 'Bearer <token>' },
};
const noteIdParam = {
  in: 'path', name: 'id', required: true,
  schema: { type: 'string', format: 'uuid' },
  description: 'Note UUID',
};

module.exports = {
  openapi: '3.0.0',
  info: {
    title: 'Notes API',
    version: '1.0.0',
    description: 'Multi-user notes service with JWT auth, sharing, and categories',
  },
  servers: [{ url: process.env.BASE_URL || 'http://localhost:3000', description: 'Server' }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: { Note: noteSchema },
  },
  paths: {
    '/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new user',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: {
            type: 'object', required: ['email', 'password'],
            properties: {
              email:    { type: 'string', format: 'email' },
              password: { type: 'string', minLength: 8 },
            },
          }}},
        },
        responses: {
          201: { description: 'User registered', content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string' } } } } } },
          400: { description: 'Validation error' },
          409: { description: 'Email already registered' },
        },
      },
    },
    '/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login and receive a JWT',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: {
            type: 'object', required: ['email', 'password'],
            properties: {
              email:    { type: 'string', format: 'email' },
              password: { type: 'string' },
            },
          }}},
        },
        responses: {
          200: { description: 'JWT token', content: { 'application/json': { schema: { type: 'object', properties: { access_token: { type: 'string' } } } } } },
          401: { description: 'Invalid credentials', content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string' } } } } } },
        },
      },
    },
    '/notes': {
      get: {
        tags: ['Notes'],
        summary: 'Get all notes (owned + shared)',
        security: [bearerAuth],
        parameters: [
          { in: 'query', name: 'page',  schema: { type: 'integer', default: 1 } },
          { in: 'query', name: 'limit', schema: { type: 'integer', default: 20, maximum: 100 } },
        ],
        responses: {
          200: { description: 'List of notes', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Note' } } } } },
          401: { description: 'Unauthorized' },
        },
      },
      post: {
        tags: ['Notes'],
        summary: 'Create a new note',
        security: [bearerAuth],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: {
            type: 'object', required: ['title', 'content'],
            properties: {
              title:    { type: 'string' },
              content:  { type: 'string' },
              category: { type: 'string', nullable: true },
            },
          }}},
        },
        responses: {
          201: { description: 'Created note', content: { 'application/json': { schema: { $ref: '#/components/schemas/Note' } } } },
          400: { description: 'Validation error' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/notes/search': {
      get: {
        tags: ['Notes'],
        summary: 'Full-text search across title and content',
        security: [bearerAuth],
        parameters: [
          { in: 'query', name: 'q', required: true, schema: { type: 'string' }, description: 'Search keyword' },
        ],
        responses: {
          200: { description: 'Matching notes', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Note' } } } } },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/notes/category/{name}': {
      get: {
        tags: ['Notes', 'Categories'],
        summary: 'Filter notes by category (unique feature)',
        security: [bearerAuth],
        parameters: [
          { in: 'path', name: 'name', required: true, schema: { type: 'string' }, description: 'Category name (case-insensitive)' },
        ],
        responses: {
          200: { description: 'Notes in category', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Note' } } } } },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/notes/{id}': {
      get: {
        tags: ['Notes'],
        summary: 'Get a note by ID (accessible if owned or shared)',
        security: [bearerAuth],
        parameters: [noteIdParam],
        responses: {
          200: { description: 'Note data', content: { 'application/json': { schema: { $ref: '#/components/schemas/Note' } } } },
          401: { description: 'Unauthorized' },
          404: { description: 'Note not found' },
        },
      },
      put: {
        tags: ['Notes'],
        summary: 'Update a note (owner only)',
        security: [bearerAuth],
        parameters: [noteIdParam],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: {
            type: 'object',
            properties: {
              title:    { type: 'string' },
              content:  { type: 'string' },
              category: { type: 'string', nullable: true },
            },
          }}},
        },
        responses: {
          200: { description: 'Updated note', content: { 'application/json': { schema: { $ref: '#/components/schemas/Note' } } } },
          401: { description: 'Unauthorized' },
          404: { description: 'Note not found' },
        },
      },
      delete: {
        tags: ['Notes'],
        summary: 'Delete a note (owner only)',
        security: [bearerAuth],
        parameters: [noteIdParam],
        responses: {
          204: { description: 'Deleted' },
          401: { description: 'Unauthorized' },
          404: { description: 'Note not found' },
        },
      },
    },
    '/notes/{id}/share': {
      post: {
        tags: ['Notes'],
        summary: 'Share a note with another user by email',
        security: [bearerAuth],
        parameters: [noteIdParam],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: {
            type: 'object', required: ['share_with_email'],
            properties: { share_with_email: { type: 'string', format: 'email' } },
          }}},
        },
        responses: {
          200: { description: 'Shared successfully' },
          400: { description: 'Bad request' },
          404: { description: 'Note or user not found' },
          409: { description: 'Already shared' },
        },
      },
    },
    '/about': {
      get: {
        tags: ['Meta'],
        summary: 'About this API',
        responses: { 200: { description: 'Author and feature info' } },
      },
    },
  },
};
