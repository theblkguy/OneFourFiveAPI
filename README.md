# OneFourFive API

REST API for chord progressions by key, scale, mood, genre, and duration. Returns progressions as chord symbols (triads and extended harmony: 7ths, 9ths), with optional bar count or duration. Use it for composition, education, backing tracks, or any application that needs chord progression data.

## Tech stack

- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Data:** In-memory progression templates (pop, rock, jazz, anime, ambient, cinematic)
- **Docs:** OpenAPI 3 spec, Swagger UI at `/api-docs`

## Quick start

```bash
npm install
npm start
```

The server listens on `http://localhost:3000` (or the value of `PORT`).

## API documentation

- **Interactive docs (Swagger UI):** `http://localhost:3000/api-docs` — try all endpoints from the browser.
- **OpenAPI 3 spec (JSON):** `http://localhost:3000/openapi.json` — for code generation, Postman, or other API tools.

## Run with Docker

```bash
docker compose up
```

Or build and run the image directly:

```bash
docker build -t onefourfive-api .
docker run -p 3000:3000 onefourfive-api
```

The Dockerfile uses a multi-stage build (production dependencies only in the final image), runs as a non-root user, and includes a HEALTHCHECK for orchestration. See `.dockerignore` for excluded files.

## Development

```bash
npm run lint          # ESLint on src/
npm test              # Unit and integration tests (Jest, supertest)
npm run test:watch    # Jest watch mode
```

## Endpoints

### GET /progressions

Returns a chord progression in the given key and scale.

**Required query parameters**

| Parameter | Type   | Description |
|-----------|--------|-------------|
| `key`     | string | Root note: C, C#, Db, D, … B |
| `scale`   | string | `major` or `minor` |

**Optional query parameters**

| Parameter           | Type   | Description |
|---------------------|--------|-------------|
| `genre`             | string | pop, rock, jazz, avantGarde, anime, ambient, cinematic. Default: pop. |
| `mood`              | string | calm, upbeat, dark, neutral (filters template). |
| `style`             | string | e.g. royalRoad, andalusian, ballad (filters template). |
| `bpm`               | number | Tempo. If omitted, uses template default. |
| `duration_seconds`  | number | Target length in seconds; API returns enough bars to fill approximately this duration. |
| `bars`              | number | Exact number of bars. Default 8 if neither duration_seconds nor bars is set. |
| `simple`            | string | `true` or `1` for a minimal response (summary, key, scale, bpm, progression, bars). |

**Response:** `summary`, `key`, `scale`, `bpm`, `progression` (array of chord symbols), `bars`, and optionally `chords` (per-chord detail with roman numerals), `loop_description`, `duration_seconds`. Some templates return extended chords (e.g. Fmaj7, G7, Am7) and may include a `voicing` hint (e.g. `quartal`).

**Example (200)**

```json
{
  "summary": "C major, 90 BPM: C → F → Am → G (57×, ~608s)",
  "key": "C",
  "scale": "major",
  "bpm": 90,
  "progression": ["C", "F", "Am", "G"],
  "bars": 228,
  "bar_duration_seconds": 2.67,
  "mood": "calm",
  "genre": "pop",
  "style": "calm",
  "chords": [
    { "position": 1, "roman": "I", "symbol": "C", "bars": 57 },
    { "position": 2, "roman": "IV", "symbol": "F", "bars": 57 },
    { "position": 3, "roman": "vi", "symbol": "Am", "bars": 57 },
    { "position": 4, "roman": "V", "symbol": "G", "bars": 57 }
  ],
  "loop_description": "Repeat progression 57 times to fill ~608s at 90 BPM.",
  "duration_seconds": 608
}
```

### POST /progressions/resolve

Returns full progressions from templates that contain all of your input chords, optionally filtered by genre, mood, or style.

**Request body (JSON)**

| Field    | Type   | Required | Description |
|----------|--------|----------|-------------|
| `chords` | array  | yes      | Chord symbols (e.g. `["C", "G", "Am"]`). Triads or extended (e.g. Cmaj7). |
| `key`    | string | yes      | Root note: C, C#, Db, D, … B |
| `scale`  | string | yes      | `major` or `minor` |
| `genre`  | string | no       | Filter by genre (pop, rock, jazz, etc.) |
| `mood`   | string | no       | Filter by mood (calm, upbeat, dark, neutral) |
| `style`  | string | no       | Filter by style (e.g. creep, epic, ballad) |

**Response:** `input_chords`, `input_romans`, `key`, `scale`, `matches` (array of progressions with `progression`, `roman_pattern`, `genre`, `style`, `mood`, `default_bpm`). If no templates match, `matches` is empty and `message` explains.

**Example (200)**

```json
{
  "input_chords": ["C", "G", "Am"],
  "input_romans": ["I", "V", "vi"],
  "key": "C",
  "scale": "major",
  "matches": [
    {
      "progression": ["C", "G", "Am", "F"],
      "roman_pattern": ["I", "V", "vi", "IV"],
      "genre": "pop",
      "style": "upbeat",
      "mood": "upbeat",
      "default_bpm": 120
    }
  ]
}
```

### GET /progressions/options

Returns allowed values for keys, scales, moods, genres, and styles.

### GET /health

Health check. Response: `{ "status": "ok", "service": "chord-progression-api" }`.

## Example requests

Replace `http://localhost:3000` with your server URL if different.

**Basic progression (C major, default bars)**

```bash
curl "http://localhost:3000/progressions?key=C&scale=major"
curl "http://localhost:3000/progressions?key=C&scale=major&simple=true"
```

**Progression with target duration**

```bash
curl "http://localhost:3000/progressions?key=C&scale=major&mood=calm&duration_seconds=600"
```

**Anime Royal Road (IV–V–iii–vi)**

```bash
curl "http://localhost:3000/progressions?key=C&scale=major&genre=anime&style=royalRoad"
```

**Anime with 7ths and quartal voicing hint**

```bash
curl "http://localhost:3000/progressions?key=C&scale=major&genre=anime&style=ghibli"
```

**Andalusian cadence (A minor)**

```bash
curl "http://localhost:3000/progressions?key=A&scale=minor&genre=pop&style=andalusian"
```

**Jazz ii–V–I**

```bash
curl "http://localhost:3000/progressions?key=G&scale=major&genre=jazz&style=basic"
```

**Resolve: find progressions containing given chords**

```bash
curl -X POST http://localhost:3000/progressions/resolve \
  -H "Content-Type: application/json" \
  -d '{"chords": ["C", "G", "Am"], "key": "C", "scale": "major"}'
```

**List options**

```bash
curl "http://localhost:3000/progressions/options"
```

## Genre and style coverage

- **Pop / rock:** I–V–vi–IV, I–IV–vi–V, vi–IV–I–V, 50s, ballad, Andalusian (minor), Creep (I–III–IV–iv), Dark resolve (I–iv–IV–I), Neapolitan (I–bII–V–I). Borrowed: I–bVII–IV–I (mixolydian), I–bVI–bVII–I (epic).
- **Jazz / avant-garde:** ii–V–I, I–vi–ii–V, iii–vi–ii–V, I–bVII–IV–I.
- **Anime:** Royal Road (IV–V–iii–vi), short, resolve, resolveDirect, reverseResolve, emotional, nostalgic, whimsical, ascending, rotated, epic, ballad, op/ed. Extended harmony: royalRoad7, resolve7, nostalgic7, whimsical9 (IVmaj7, V7, iii7, vi7, Imaj7, etc.). Style `ghibli` returns 7th chords with `voicing: "quartal"`.
- **Ambient / cinematic:** I–IV–I, I–vi–I, minimal, cinematic minor, bVI–bVII–I (epic).

## License

MIT
