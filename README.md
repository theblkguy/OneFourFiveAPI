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

**List options**

```bash
curl "http://localhost:3000/progressions/options"
```

## Genre coverage

- **Common (pop, rock):** I–V–vi–IV, I–IV–vi–V, vi–IV–I–V, 50s, ballad, Andalusian (minor), etc.
- **Jazz / avant-garde:** ii–V–I, I–vi–ii–V, iii–vi–ii–V, I–bVII–IV–I, etc.
- **Anime:** Royal Road (IV–V–iii–vi), short, resolve, emotional, epic, ballad, op/ed.
- **Ambient / cinematic:** I–IV–I, I–vi–I, minimal, cinematic minor.

## License

MIT
