# OneFourFive API (Chord Progression API)

REST API for chord progressions by key, scale, mood, genre, and duration. Built for portfolio use and the "for spoken content" use case (e.g. background music length for TTS/audiobooks).

## Tech stack

- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Data:** In-memory progression templates (common, jazz/avant-garde, anime, ambient/cinematic)

## Quick start

```bash
npm install
npm start
```

Server runs at `http://localhost:3000` (or `PORT` from env).

## Run with Docker

**Using Docker Compose (easiest):**

```bash
docker compose up
```

Builds the image (first time), starts the API, and maps port 3000. Open [http://localhost:3000](http://localhost:3000) and [http://localhost:3000/api-docs](http://localhost:3000/api-docs). Stop with `Ctrl+C`, or run `docker compose down`.

**Using Docker directly:**

```bash
docker build -t onefourfive-api .
docker run -p 3000:3000 onefourfive-api
```

**What’s going on:** The **Dockerfile** uses a **multi-stage build**: stage 1 installs production dependencies only; stage 2 copies those deps plus your app into the final image (no devDependencies, smaller image). The app runs as the **non-root `node` user** (security best practice). **HEALTHCHECK** lets Docker and orchestrators (K8s, Render, etc.) know when the API is up. **Docker build** turns this into an image; **docker run** or **docker compose up** starts a container and maps port 3000 so you can hit the API at localhost. The **.dockerignore** keeps tests and dev config out of the image so it stays small and builds faster.

## Deploy for free (Render)

You can host this API for free on [Render](https://render.com):

1. Push this repo to GitHub.
2. Go to [dashboard.render.com](https://dashboard.render.com), sign in, and click **New** → **Web Service**.
3. Connect your GitHub account and select this repository.
4. Render will detect `render.yaml` (Blueprint). Confirm **Build command:** `npm install`, **Start command:** `npm start`, and **Plan:** Free, then create the service.

Your API will be live at `https://<your-service-name>.onrender.com`. Use that base URL for the API and for the interactive docs: `https://<your-service-name>.onrender.com/api-docs`.

**Free tier note:** The service **spins down after 15 minutes of no traffic**. The first request after a spin-down can take **30–60 seconds** while the server starts; later requests are fast until the next idle period. This is normal for Render’s free tier and is fine for demos and portfolio use.

## Development

```bash
npm run lint    # ESLint on src/
npm test        # Jest unit + integration tests
npm run test:watch   # Jest watch mode
```

## API documentation

- **Interactive docs (Swagger UI):** [http://localhost:3000/api-docs](http://localhost:3000/api-docs) — try all endpoints from the browser.
- **OpenAPI 3 spec (JSON):** [http://localhost:3000/openapi.json](http://localhost:3000/openapi.json) — for codegen, Postman, or other API tools.

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
| `bpm`                | number | Tempo. If omitted, uses template default. |
| `duration_seconds`  | number | **For spoken content.** Target length in seconds; API returns enough bars to fill ~this duration. |
| `bars`              | number | Exact number of bars. Default 8 if neither duration_seconds nor bars set. |
| `simple`           | flag   | If `true` or `1`, returns a minimal response (summary, key, scale, bpm, progression, bars) for easier reading. |

**Full response** includes a one-line `summary` at the top, then key, scale, bpm, progression, bars, and detailed `chords` / `loop_description`. Add `?simple=true` for a **minimal response** (summary + key, scale, bpm, progression, bars only).

**Example full response (200)**

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

**Example minimal response** (`?simple=true`)

```json
{
  "summary": "C major, 90 BPM: C → F → Am → G (57×, ~608s)",
  "key": "C",
  "scale": "major",
  "bpm": 90,
  "progression": ["C", "F", "Am", "G"],
  "bars": 228,
  "duration_seconds": 608
}
```

### POST /progressions/resolve

Returns full progressions from templates that contain all of your input chords, filtered by preferences.

**Request body (JSON)**

| Field   | Type   | Required | Description |
|---------|--------|----------|-------------|
| `chords`| array  | yes      | Chord symbols (e.g. `["C", "G", "Am"]`) |
| `key`   | string | yes      | Root note: C, C#, Db, D, … B |
| `scale` | string | yes      | `major` or `minor` |
| `genre` | string | no       | Filter by genre (pop, rock, jazz, etc.) |
| `mood`  | string | no       | Filter by mood (calm, upbeat, dark, neutral) |
| `style` | string | no       | Filter by style (e.g. creep, epic, ballad) |

**Example request**

```bash
curl -X POST http://localhost:3000/progressions/resolve \
  -H "Content-Type: application/json" \
  -d '{"chords": ["C", "G", "Am"], "key": "C", "scale": "major", "genre": "pop"}'
```

**Example response (200)**

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
    },
    {
      "progression": ["C", "F", "Am", "G"],
      "roman_pattern": ["I", "IV", "vi", "V"],
      "genre": "pop",
      "style": "calm",
      "mood": "calm",
      "default_bpm": 90
    }
  ]
}
```

If no templates match, `matches` is empty and `message` indicates "No templates contain all your chords."

### GET /progressions/options

Returns allowed values for keys, scales, moods, genres, and styles.

### GET /health

Health check. Returns `{ "status": "ok", "service": "onefourfive-api" }`.

## Example requests (curl)

**Basic progression (C major, 8 bars)** — add `&simple=true` for a shorter response.

```bash
curl "http://localhost:3000/progressions?key=C&scale=major"
curl "http://localhost:3000/progressions?key=C&scale=major&simple=true"
```

**Calm progression for ~10 minutes (for spoken content)**

```bash
curl "http://localhost:3000/progressions?key=C&scale=major&mood=calm&duration_seconds=600"
```

**Anime Royal Road (IV–V–iii–vi)**

```bash
curl "http://localhost:3000/progressions?key=C&scale=major&genre=anime&style=royalRoad"
```

**Andalusian cadence (A minor, i–bVII–bVI–V)**

```bash
curl "http://localhost:3000/progressions?key=A&scale=minor&genre=pop&style=andalusian"
```

**Jazz ii–V–I**

```bash
curl "http://localhost:3000/progressions?key=G&scale=major&genre=jazz&style=basic"
```

**Borrowed chord progressions (Creep, Epic, Dark resolve)**

```bash
curl "http://localhost:3000/progressions?key=C&scale=major&genre=pop&style=creep"
curl "http://localhost:3000/progressions?key=C&scale=major&genre=rock&style=epic"
curl "http://localhost:3000/progressions?key=C&scale=major&genre=rock&style=darkResolve"
```

**Resolve: find progressions containing your chords**

```bash
curl -X POST http://localhost:3000/progressions/resolve \
  -H "Content-Type: application/json" \
  -d '{"chords": ["C", "G", "Am"], "key": "C", "scale": "major"}'
```

**List options**

```bash
curl "http://localhost:3000/progressions/options"
```

## Genre coverage

- **Common (pop, rock):** I–V–vi–IV, I–IV–vi–V, vi–IV–I–V, 50s, ballad, Andalusian (minor), Creep (I–III–IV–iv), Dark resolve (I–iv–IV–I), Neapolitan (I–bII–V–I), etc.
- **Rock (borrowed chords):** I–bVII–IV–I (mixolydian), I–bVI–bVII–I (epic).
- **Jazz / avant-garde:** ii–V–I, I–vi–ii–V, iii–vi–ii–V, I–bVII–IV–I, etc.
- **Anime:** Royal Road (IV–V–iii–vi), short, resolve, resolveDirect, reverseResolve, emotional, nostalgic, whimsical, ascending, rotated, epic, ballad, op/ed. **Extended harmony:** royalRoad7, resolve7, nostalgic7, whimsical9 (7ths/9ths: IVmaj7, V7, iii7, vi7, Imaj7, etc.). **Quartal voicing:** style `ghibli` returns the same 7th progression with `voicing: "quartal"` for Ghibli-style voicing hints.
- **Ambient / cinematic:** I–IV–I, I–vi–I, minimal, cinematic minor, bVI–bVII–I (epic).

## License

MIT
