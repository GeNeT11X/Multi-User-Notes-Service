const noteSchema = {
  type: 'object',
  properties: {
    id:         { type: 'string', example: '665abc123def456789012345' },
    title:      { type: 'string', example: 'My Note' },
    content:    { type: 'string', example: 'Note body here' },
    owner:      { type: 'string', example: '665abc...' },
    sharedWith: { type: 'array', items: { type: 'string' } },
    tags:       { type: 'array', items: { type: 'string' }, example: ['work', 'urgent'] },
    isPinned:   { type: 'boolean', default: false },
    created_at: { type: 'string', format: 'date-time' },
    updated_at: { type: 'string', format: 'date-time' },
  },
};

const errorSchema = {
  type: 'object',
  properties: { message: { type: 'string' } },
};

const noteIdParam = {
  in: 'path', name: 'id', required: true,
  schema: { type: 'string' },
  description: 'MongoDB ObjectId of the note',
};

const bearerSecurity = [{ bearerAuth: [] }];

const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Notes API',
    version: '2.0.0',
    description:
      'Multi-user Notes Service REST API — JWT auth, MongoDB, note sharing, full-text search, and pinning.',
  },
  servers: [
    {
      url: process.env.BASE_URL || 'http://localhost:3000',
      description: 'Active server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      Note:  noteSchema,
      Error: errorSchema,
    },
  },
  paths: {
    '/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object', required: ['email', 'password'],
                properties: {
                  email:    { type: 'string', format: 'email', example: 'user@example.com' },
                  password: { type: 'string', minLength: 8, example: 'password123' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Registered successfully', content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string' } } } } } },
          400: { description: 'Validation error', content: { 'application/json': { schema: errorSchema } } },
          409: { description: 'Email already exists', content: { 'application/json': { schema: errorSchema } } },
        },
      },
    },
    '/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login and receive JWT',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object', required: ['email', 'password'],
                properties: {
                  email:    { type: 'string', format: 'email' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Login successful', content: { 'application/json': { schema: { type: 'object', properties: { access_token: { type: 'string' } } } } } },
          401: { description: 'Invalid credentials', content: { 'application/json': { schema: errorSchema } } },
        },
      },
    },
    '/notes': {
      get: {
        tags: ['Notes'],
        summary: 'Get all notes (owned + shared). Supports pagination and full-text search.',
        security: bearerSecurity,
        parameters: [
          { in: 'query', name: 'page',  schema: { type: 'integer', default: 1 }, description: 'Page number' },
          { in: 'query', name: 'limit', schema: { type: 'integer', default: 20, maximum: 100 }, description: 'Results per page' },
          { in: 'query', name: 'q',     schema: { type: 'string' }, description: 'Full-text search keyword' },
        ],
        responses: {
          200: { description: 'List of notes', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Note' } } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: errorSchema } } },
        },
      },
      post: {
        tags: ['Notes'],
        summary: 'Create a new note',
        security: bearerSecurity,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object', required: ['title', 'content'],
                properties: {
                  title:   { type: 'string', maxLength: 200 },
                  content: { type: 'string' },
                  tags:    { type: 'array', items: { type: 'string' } },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Note created', content: { 'application/json': { schema: { $ref: '#/components/schemas/Note' } } } },
          400: { description: 'Validation error', content: { 'application/json': { schema: errorSchema } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: errorSchema } } },
        },
      },
    },
    '/notes/{id}': {
      get: {
        tags: ['Notes'],
        summary: 'Get a note by ID (owner or shared user)',
        security: bearerSecurity,
        parameters: [noteIdParam],
        responses: {
          200: { description: 'Note data', content: { 'application/json': { schema: { $ref: '#/components/schemas/Note' } } } },
          400: { description: 'Invalid ID', content: { 'application/json': { schema: errorSchema } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: errorSchema } } },
          404: { description: 'Note not found', content: { 'application/json': { schema: errorSchema } } },
        },
      },
      put: {
        tags: ['Notes'],
        summary: 'Update a note (owner only)',
        security: bearerSecurity,
        parameters: [noteIdParam],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title:    { type: 'string', maxLength: 200 },
                  content:  { type: 'string' },
                  tags:     { type: 'array', items: { type: 'string' } },
                  isPinned: { type: 'boolean' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Updated note', content: { 'application/json': { schema: { $ref: '#/components/schemas/Note' } } } },
          400: { description: 'Validation / invalid ID', content: { 'application/json': { schema: errorSchema } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: errorSchema } } },
          404: { description: 'Note not found or not owner', content: { 'application/json': { schema: errorSchema } } },
        },
      },
      delete: {
        tags: ['Notes'],
        summary: 'Delete a note (owner only)',
        security: bearerSecurity,
        parameters: [noteIdParam],
        responses: {
          204: { description: 'Deleted' },
          400: { description: 'Invalid ID', content: { 'application/json': { schema: errorSchema } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: errorSchema } } },
          404: { description: 'Note not found or not owner', content: { 'application/json': { schema: errorSchema } } },
        },
      },
    },
    '/notes/{id}/share': {
      post: {
        tags: ['Notes'],
        summary: 'Share a note with another user by email',
        security: bearerSecurity,
        parameters: [noteIdParam],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object', required: ['share_with_email'],
                properties: { share_with_email: { type: 'string', format: 'email' } },
              },
            },
          },
        },
        responses: {
          200: { description: 'Shared successfully' },
          400: { description: 'Bad request', content: { 'application/json': { schema: errorSchema } } },
          404: { description: 'Note or user not found', content: { 'application/json': { schema: errorSchema } } },
          409: { description: 'Already shared', content: { 'application/json': { schema: errorSchema } } },
        },
      },
    },
    '/notes/{id}/pin': {
      patch: {
        tags: ['Notes'],
        summary: 'Toggle pin status of a note (owner only)',
        security: bearerSecurity,
        parameters: [noteIdParam],
        responses: {
          200: { description: 'Pin toggled' },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: errorSchema } } },
          404: { description: 'Note not found', content: { 'application/json': { schema: errorSchema } } },
        },
      },
    },
    '/about': {
      get: {
        tags: ['Meta'],
        summary: 'About this API',
        responses: { 200: { description: 'Author info and features' } },
      },
    },
  },
};

module.exports = swaggerSpec;
