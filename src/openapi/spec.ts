/**
 * OpenAPI 3.0 spec for OneFourFive API.
 * Served at /openapi.json; Swagger UI at /api-docs.
 */
const spec = {
  openapi: '3.0.3',
  info: {
    title: 'OneFourFive API',
    description: 'REST API for chord progressions by key, scale, mood, genre, and duration. Get progressions for a key/scale, or resolve a list of chords to find matching template progressions.',
    version: '1.0.0',
  },
  servers: [
    { url: '/', description: 'Current host' },
  ],
  paths: {
    '/auth/register': {
      post: {
        summary: 'Register a new user',
        description: 'Create an account. Returns a JWT and user object. Use the token in Authorization: Bearer <token> for progression endpoints.',
        operationId: 'register',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'user@example.com' },
                  password: { type: 'string', minLength: 8, example: 'password123' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Registered',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthSuccess' },
              },
            },
          },
          '400': { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '409': { description: 'Email already taken', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/auth/login': {
      post: {
        summary: 'Log in',
        description: 'Returns a JWT and user object. Use the token in Authorization: Bearer <token> for progression endpoints.',
        operationId: 'login',
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
          '200': {
            description: 'Logged in',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthSuccess' },
              },
            },
          },
          '400': { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '401': { description: 'Invalid credentials', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/progressions': {
      get: {
        summary: 'Get a chord progression',
        security: [{ bearerAuth: [] }],
        description: 'Returns a chord progression in the given key and scale. Optionally filter by genre, mood, style; set BPM, duration in seconds, or exact bar count. Templates may use 7ths/9ths (e.g. IVmaj7, V7, vi7) and may include an optional voicing hint (e.g. quartal for Ghibli-style).',
        operationId: 'getProgressions',
        parameters: [
          { name: 'key', in: 'query', required: true, description: 'Root note (e.g. C, G, A)', schema: { type: 'string', example: 'C' } },
          { name: 'scale', in: 'query', required: true, description: 'Scale', schema: { type: 'string', enum: ['major', 'minor'], example: 'major' } },
          { name: 'genre', in: 'query', required: false, description: 'Genre (pop, rock, jazz, anime, ambient, cinematic, etc.)', schema: { type: 'string', example: 'pop' } },
          { name: 'mood', in: 'query', required: false, description: 'Mood (calm, upbeat, dark, neutral)', schema: { type: 'string' } },
          { name: 'style', in: 'query', required: false, description: 'Style (e.g. royalRoad, andalusian, ballad)', schema: { type: 'string' } },
          { name: 'bpm', in: 'query', required: false, description: 'Tempo (1–300). Omit to use template default.', schema: { type: 'number', example: 90 } },
          { name: 'duration_seconds', in: 'query', required: false, description: 'Target length in seconds (e.g. for spoken content)', schema: { type: 'number', example: 600 } },
          { name: 'bars', in: 'query', required: false, description: 'Exact number of bars', schema: { type: 'number', example: 16 } },
          { name: 'simple', in: 'query', required: false, description: 'If true or 1, return minimal response (summary, key, scale, bpm, progression, bars)', schema: { type: 'string', enum: ['true', 'false', '1', '0'] } },
        ],
        responses: {
          '200': {
            description: 'Chord progression',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ProgressionResponse' },
                example: {
                  summary: 'C major, 90 BPM: C → F → Am → G (57×, ~608s)',
                  key: 'C',
                  scale: 'major',
                  bpm: 90,
                  progression: ['C', 'F', 'Am', 'G'],
                  bars: 228,
                  bar_duration_seconds: 2.67,
                  mood: 'calm',
                  genre: 'pop',
                  style: 'calm',
                  chords: [
                    { position: 1, roman: 'I', symbol: 'C', bars: 57 },
                    { position: 2, roman: 'IV', symbol: 'F', bars: 57 },
                    { position: 3, roman: 'vi', symbol: 'Am', bars: 57 },
                    { position: 4, roman: 'V', symbol: 'G', bars: 57 },
                  ],
                  loop_description: 'Repeat progression 57 times to fill ~608s at 90 BPM.',
                  duration_seconds: 608,
                },
              },
            },
          },
          '400': {
            description: 'Invalid or missing parameters',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
                example: { error: 'key and scale are required', message: 'Provide key (e.g. C, G) and scale (major or minor) as query parameters.' },
              },
            },
          },
        },
      },
    },
    '/progressions/resolve': {
      post: {
        summary: 'Resolve chords to matching progressions',
        description: 'Returns full progressions from templates that contain all of your input chords, filtered by optional genre, mood, and style.',
        operationId: 'resolveProgressions',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['chords', 'key', 'scale'],
                properties: {
                  chords: { type: 'array', items: { type: 'string' }, description: 'Chord symbols (e.g. C, G, Am)', example: ['C', 'G', 'Am'] },
                  key: { type: 'string', description: 'Root note', example: 'C' },
                  scale: { type: 'string', enum: ['major', 'minor'], example: 'major' },
                  genre: { type: 'string', description: 'Filter by genre' },
                  mood: { type: 'string', description: 'Filter by mood' },
                  style: { type: 'string', description: 'Filter by style' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Matching progressions',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ResolveResponse' },
                example: {
                  input_chords: ['C', 'G', 'Am'],
                  input_romans: ['I', 'V', 'vi'],
                  key: 'C',
                  scale: 'major',
                  matches: [
                    {
                      progression: ['C', 'G', 'Am', 'F'],
                      roman_pattern: ['I', 'V', 'vi', 'IV'],
                      genre: 'pop',
                      style: 'upbeat',
                      mood: 'upbeat',
                      default_bpm: 120,
                    },
                    {
                      progression: ['C', 'F', 'Am', 'G'],
                      roman_pattern: ['I', 'IV', 'vi', 'V'],
                      genre: 'pop',
                      style: 'calm',
                      mood: 'calm',
                      default_bpm: 90,
                    },
                  ],
                },
              },
            },
          },
          '400': {
            description: 'Invalid request (e.g. missing chords/key/scale, invalid chords)',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
                example: { error: 'chords required', message: 'Provide chords as an array (e.g. ["C", "G", "Am"])' },
              },
            },
          },
          '401': { description: 'JWT required', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/progressions/complete': {
      post: {
        summary: 'Finish a progression',
        security: [{ bearerAuth: [] }],
        description: 'Returns full progressions that start with your chord sequence (prefix match), plus a completion array—the rest of the progression—so you can finish your idea.',
        operationId: 'completeProgressions',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['chords', 'key', 'scale'],
                properties: {
                  chords: { type: 'array', items: { type: 'string' }, description: 'Partial chord progression in order (e.g. C, G, Am)', example: ['C', 'G', 'Am'] },
                  key: { type: 'string', description: 'Root note', example: 'C' },
                  scale: { type: 'string', enum: ['major', 'minor'], example: 'major' },
                  genre: { type: 'string', description: 'Filter by genre' },
                  mood: { type: 'string', description: 'Filter by mood' },
                  style: { type: 'string', description: 'Filter by style' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Matching progressions with completion',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CompleteResponse' },
                example: {
                  input_chords: ['C', 'G', 'Am'],
                  input_romans: ['I', 'V', 'vi'],
                  key: 'C',
                  scale: 'major',
                  matches: [
                    {
                      progression: ['C', 'G', 'Am', 'F'],
                      roman_pattern: ['I', 'V', 'vi', 'IV'],
                      genre: 'pop',
                      style: 'upbeat',
                      mood: 'upbeat',
                      default_bpm: 120,
                      completion: ['F'],
                    },
                  ],
                },
              },
            },
          },
          '400': {
            description: 'Invalid request (e.g. missing chords/key/scale, invalid chords)',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
                example: { error: 'chords required', message: 'Provide chords as an array (e.g. ["C", "G", "Am"])' },
              },
            },
          },
          '401': { description: 'JWT required', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/progressions/options': {
      get: {
        summary: 'Get allowed options',
        security: [{ bearerAuth: [] }],
        description: 'Returns allowed values for keys, scales, moods, genres, and styles. If genre is provided, moods and styles are filtered to those available for that genre.',
        operationId: 'getOptions',
        parameters: [
          { name: 'genre', in: 'query', required: false, description: 'Filter moods and styles to this genre', schema: { type: 'string', example: 'anime' } },
        ],
        responses: {
          '200': {
            description: 'Options',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    keys: { type: 'array', items: { type: 'string' } },
                    scales: { type: 'array', items: { type: 'string' } },
                    moods: { type: 'array', items: { type: 'string' } },
                    genres: { type: 'array', items: { type: 'string' } },
                    styles: { type: 'array', items: { type: 'string' } },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/health': {
      get: {
        summary: 'Health check',
        description: 'Returns service health status.',
        operationId: 'health',
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                    service: { type: 'string', example: 'chord-progression-api' },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT from POST /auth/login or POST /auth/register',
      },
    },
    schemas: {
      AuthSuccess: {
        type: 'object',
        properties: {
          token: { type: 'string', description: 'JWT for Authorization header' },
          user: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              email: { type: 'string' },
              createdAt: { type: 'string', format: 'date-time' },
            },
          },
          expiresIn: { type: 'string', example: '7d' },
        },
      },
      ProgressionResponse: {
        type: 'object',
        properties: {
          summary: { type: 'string' },
          key: { type: 'string' },
          scale: { type: 'string' },
          bpm: { type: 'number' },
          progression: { type: 'array', items: { type: 'string' } },
          bars: { type: 'number' },
          bar_duration_seconds: { type: 'number' },
          mood: { type: 'string' },
          genre: { type: 'string' },
          style: { type: 'string' },
          chords: {
            type: 'array',
            items: {
              type: 'object',
              properties: { position: { type: 'number' }, roman: { type: 'string' }, symbol: { type: 'string' }, bars: { type: 'number' } },
            },
          },
          loop_description: { type: 'string' },
          duration_seconds: { type: 'number' },
          voicing: { type: 'string', description: 'Optional voicing hint (e.g. quartal) when template specifies it.' },
        },
      },
      ResolveResponse: {
        type: 'object',
        properties: {
          input_chords: { type: 'array', items: { type: 'string' } },
          input_romans: { type: 'array', items: { type: 'string' } },
          key: { type: 'string' },
          scale: { type: 'string' },
          matches: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                progression: { type: 'array', items: { type: 'string' } },
                roman_pattern: { type: 'array', items: { type: 'string' } },
                genre: { type: 'string' },
                style: { type: 'string' },
                mood: { type: 'string' },
                default_bpm: { type: 'number' },
              },
            },
          },
          message: { type: 'string' },
        },
      },
      CompleteResponse: {
        type: 'object',
        properties: {
          input_chords: { type: 'array', items: { type: 'string' } },
          input_romans: { type: 'array', items: { type: 'string' } },
          key: { type: 'string' },
          scale: { type: 'string' },
          matches: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                progression: { type: 'array', items: { type: 'string' } },
                roman_pattern: { type: 'array', items: { type: 'string' } },
                genre: { type: 'string' },
                style: { type: 'string' },
                mood: { type: 'string' },
                default_bpm: { type: 'number' },
                completion: { type: 'array', items: { type: 'string' }, description: 'Rest of the progression after your prefix (chord symbols to append)' },
              },
            },
          },
          message: { type: 'string' },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          error: { type: 'string' },
          message: { type: 'string' },
          invalid_chords: { type: 'array', items: { type: 'string' } },
        },
      },
    },
  },
};

export default spec;
