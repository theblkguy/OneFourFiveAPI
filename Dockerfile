# OneFourFive API — production-style Docker image
#
# Practices used here (good to mention to employers):
# - Multi-stage build: deps in one stage, runtime in another (smaller, cleaner image)
# - Non-root user: process runs as "node", not root (security)
# - HEALTHCHECK: Docker/orchestrators can see if the app is up
# - Layer order: package files first so code changes don't invalidate npm cache
#
# Build: docker build -t onefourfive-api .
# Run:   docker run -p 3000:3000 onefourfive-api

# -----------------------------------------------------------------------------
# Stage 1: install production dependencies only
# -----------------------------------------------------------------------------
FROM node:20-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./

# Production deps only; lockfile ensures reproducible installs
RUN npm ci --omit=dev

# -----------------------------------------------------------------------------
# Stage 2: runtime image — copy deps + app, run as non-root
# -----------------------------------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

# Copy production node_modules from deps stage (no devDependencies)
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./

# Copy application source (respects .dockerignore)
COPY . .

# Run as non-root user (node user exists in official Node image)
RUN chown -R node:node /app
USER node

# App listens on PORT (default 3000)
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# Orchestrators (Docker, K8s, Render, etc.) can use this to know the app is healthy
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q --spider http://localhost:3000/health || exit 1

CMD ["node", "src/index.js"]
