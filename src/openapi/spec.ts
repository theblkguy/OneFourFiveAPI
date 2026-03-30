/**
 * OpenAPI 3.0 spec for OneFourFive API.
 * Served at /openapi.json; Swagger UI at /api-docs.
 */
const spec = {
  openapi: '3.0.3',
  info: {
    title: 'OneFourFive API',
    description:
      'REST API for chord progressions by key, scale, mood, genre, and duration. Template selection uses strict style+mood matching when both are provided; use legacy=true or PROGRESSION_LEGACY_MATCH for old behavior. Multi-section songs via POST /progressions/song; optional Roman transforms (rotate, dominant_extensions, borrowed_iv) on GET /progressions; template families via GET /progressions/options; resolve/complete support match=relaxed; reharmonization via POST /chords/reharmonize and POST /chords/reharmonize-progression.',
    version: '1.2.0',
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
        description:
          'Returns a chord progression in the given key and scale. When both style and mood are provided, the template must match both (see GET /progressions/options style_mood_pairs). If only mood is given and several templates share that mood, pass variation=0,1,... or specify style. Set legacy=true for legacy resolution (style OR mood). Optional `transforms` (comma-separated or repeated `transform`) applies same-length Roman transforms; `seed` shuffles transform order when multiple are given; `family` restricts templates. Deprecation headers may be set when legacy matching is used.',
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
          {
            name: 'variation',
            in: 'query',
            required: false,
            description: 'When mood alone matches multiple templates, pick by index (0-based)',
            schema: { type: 'integer', minimum: 0 },
          },
          {
            name: 'legacy',
            in: 'query',
            required: false,
            description: 'If true, use legacy template match (style OR mood). Response may include warnings.',
            schema: { type: 'string', enum: ['true', 'false', '1', '0'] },
          },
          { name: 'simple', in: 'query', required: false, description: 'If true or 1, return minimal response (summary, key, scale, bpm, progression, bars)', schema: { type: 'string', enum: ['true', 'false', '1', '0'] } },
          {
            name: 'transforms',
            in: 'query',
            required: false,
            description: 'Comma-separated Roman transform ids (rotate, dominant_extensions, borrowed_iv). Same as repeating `transform`.',
            schema: { type: 'string', example: 'dominant_extensions,borrowed_iv' },
          },
          {
            name: 'transform',
            in: 'query',
            required: false,
            description: 'One or more transform ids; may be repeated or comma-separated.',
            schema: { type: 'string' },
          },
          {
            name: 'transform_rotate_steps',
            in: 'query',
            required: false,
            description: 'Steps for the rotate transform (default 1).',
            schema: { type: 'integer' },
          },
          {
            name: 'seed',
            in: 'query',
            required: false,
            description: 'Deterministic seed to shuffle order of multiple transforms before applying.',
            schema: { type: 'number', example: 12345 },
          },
          {
            name: 'family',
            in: 'query',
            required: false,
            description: 'Restrict template to this family id (see GET /progressions/options families).',
            schema: { type: 'string', example: 'four_chord' },
          },
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
        description:
          'Returns full progressions from templates. Default match=strict: every distinct input roman must appear in the template. match=relaxed ranks templates by coverage of your chords (match_score 0–1); use limit (default 20, max 100). Input chord count is capped (default 200, override with MAX_CHORDS_RESOLVE env, max 500).',
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
                  match: { type: 'string', enum: ['strict', 'relaxed'], default: 'strict' },
                  limit: { type: 'integer', minimum: 1, maximum: 100, description: 'Max matches when match=relaxed' },
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
        description:
          'Returns full progressions that start with your chord sequence. match=strict: exact prefix on normalized romans. match=relaxed: rank by fraction of matching prefix positions (match_score); use limit (default 20, max 100).',
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
                  match: { type: 'string', enum: ['strict', 'relaxed'], default: 'strict' },
                  limit: { type: 'integer', minimum: 1, maximum: 100 },
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
        description:
          'Returns allowed values for keys, scales, moods, genres, and styles, plus style_mood_pairs and families for strict matching and filtering. If genre is provided, lists are filtered to that genre.',
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
                    style_mood_pairs: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: { style: { type: 'string' }, mood: { type: 'string' } },
                      },
                      description: 'Valid (style, mood) pairs for templates in scope',
                    },
                    families: {
                      type: 'array',
                      items: { type: 'string' },
                      description: 'Distinct template family ids (e.g. four_chord, royal_road) in scope',
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/progressions/song': {
      post: {
        summary: 'Multi-section song',
        security: [{ bearerAuth: [] }],
        description:
          'Build a song from labeled sections (A, B, bridge, etc.). Each section uses the same progression rules as GET /progressions. Optional repeat per section.',
        operationId: 'getSong',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['key', 'scale', 'sections'],
                properties: {
                  key: { type: 'string', example: 'C' },
                  scale: { type: 'string', enum: ['major', 'minor'] },
                  sections: {
                    type: 'array',
                    items: {
                      type: 'object',
                      required: ['label'],
                      properties: {
                        label: { type: 'string', example: 'A' },
                        genre: { type: 'string' },
                        style: { type: 'string' },
                        mood: { type: 'string' },
                        variation: { type: 'integer' },
                        legacy: { type: 'boolean' },
                        bpm: { type: 'number' },
                        bars: { type: 'number' },
                        duration_seconds: { type: 'number' },
                        repeat: { type: 'integer', minimum: 1, maximum: 32 },
                        transforms: { type: 'array', items: { type: 'string' }, description: 'Roman transform ids (same as GET /progressions)' },
                        transform_rotate_steps: { type: 'integer' },
                        seed: { type: 'number' },
                        family: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Song with sections and full_progression',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/SongResponse' } } },
          },
          '400': { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '401': { description: 'JWT required', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/chords/reharmonize': {
      post: {
        summary: 'Reharmonize a chord',
        security: [{ bearerAuth: [] }],
        description: 'Returns alternative chord spellings (extensions, sus/add, substitutions such as tritone sub for dominants).',
        operationId: 'reharmonizeChord',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['chord', 'key', 'scale'],
                properties: {
                  chord: { type: 'string', example: 'G7' },
                  key: { type: 'string', example: 'C' },
                  scale: { type: 'string', enum: ['major', 'minor'] },
                  kinds: {
                    type: 'array',
                    items: { type: 'string', enum: ['extension', 'extensions', 'sus_add', 'substitution', 'substitutions'] },
                  },
                  limit: { type: 'integer', minimum: 1, maximum: 48 },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Alternatives',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ReharmonizeResponse' } } },
          },
          '400': { description: 'Bad request', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '401': { description: 'JWT required', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/chords/reharmonize-progression': {
      post: {
        summary: 'Reharmonize a chord progression',
        security: [{ bearerAuth: [] }],
        description:
          'Applies one alternative per chord (extensions_only or light_jazz) with a cap on how many slots may change from the original (max_altered_slots, default 8).',
        operationId: 'reharmonizeProgression',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['chords', 'key', 'scale'],
                properties: {
                  chords: { type: 'array', items: { type: 'string' }, example: ['C', 'G', 'Am', 'F'] },
                  key: { type: 'string', example: 'C' },
                  scale: { type: 'string', enum: ['major', 'minor'] },
                  strategy: { type: 'string', enum: ['extensions_only', 'light_jazz'], default: 'extensions_only' },
                  max_altered_slots: { type: 'integer', minimum: 0, maximum: 64, default: 8 },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Progression with per-slot choices',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ReharmonizeProgressionResponse' } } },
          },
          '400': { description: 'Bad request', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '401': { description: 'JWT required', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
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
          label: { type: 'string', description: 'Present on POST /progressions/song section entries' },
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
          roman_pattern: { type: 'array', items: { type: 'string' }, description: 'Final Roman numerals after optional transforms' },
          roman_pattern_template: {
            type: 'array',
            items: { type: 'string' },
            description: 'Template Romans before transforms (when transforms were requested)',
          },
          transforms_applied: { type: 'array', items: { type: 'string' } },
          transforms_skipped: { type: 'array', items: { type: 'string' }, description: 'Unknown transform ids ignored' },
          duration_seconds: { type: 'number' },
          voicing: { type: 'string', description: 'Optional voicing hint (e.g. quartal) when template specifies it.' },
          warnings: {
            type: 'array',
            items: {
              type: 'object',
              properties: { code: { type: 'string' }, message: { type: 'string' } },
            },
            description: 'Present when legacy matching is used.',
          },
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
                match_score: { type: 'number', description: 'When match=relaxed: coverage of input romans (0–1)' },
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
                match_score: { type: 'number', description: 'When match=relaxed: fraction of prefix positions that match (0–1)' },
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
          validPairs: {
            type: 'array',
            items: { type: 'object', properties: { style: { type: 'string' }, mood: { type: 'string' } } },
          },
          stylesForMood: { type: 'array', items: { type: 'string' } },
        },
      },
      SongResponse: {
        type: 'object',
        properties: {
          key: { type: 'string' },
          scale: { type: 'string' },
          total_bars: { type: 'number' },
          approximate_duration_seconds: { type: 'number' },
          full_progression: { type: 'array', items: { type: 'string' } },
          sections: { type: 'array', items: { $ref: '#/components/schemas/ProgressionResponse' } },
        },
      },
      ReharmonizeResponse: {
        type: 'object',
        properties: {
          original: { type: 'string' },
          key: { type: 'string' },
          scale: { type: 'string' },
          roman: { type: 'string', nullable: true },
          alternatives: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                symbol: { type: 'string' },
                description: { type: 'string' },
                kind: { type: 'string', enum: ['extension', 'sus_add', 'substitution'] },
              },
            },
          },
        },
      },
      ReharmonizeProgressionResponse: {
        type: 'object',
        properties: {
          key: { type: 'string' },
          scale: { type: 'string' },
          strategy: { type: 'string', enum: ['extensions_only', 'light_jazz'] },
          progression: { type: 'array', items: { type: 'string' } },
          slots: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                position: { type: 'number' },
                original: { type: 'string' },
                symbol: { type: 'string' },
                altered: { type: 'boolean' },
              },
            },
          },
        },
      },
    },
  },
};

export default spec;
