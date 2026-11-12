# syntax=docker/dockerfile:1
# Production image for Render (dev uses Dockerfile.dev).

# === Stage 1: Build Frontend ===
FROM node:22 AS frontend-build

WORKDIR /client
COPY client/package*.json ./
# npm ci installs exactly what package-lock.json pins, like CI does.
RUN npm ci --no-audit --no-fund
COPY client .
# Render passes service env vars as build args; Vite bakes VITE_* into the bundle at build time.
ARG VITE_GOOGLE_MAPS_API_KEY
ARG VITE_GOOGLE_MAPS_MAP_ID
ARG VITE_SENTRY_DSN
ARG RENDER_GIT_COMMIT
# The Sentry auth token comes from Render's secret file `sentry_auth_token`, mounted for this step only
# (never an ARG, so it isn't kept in the image). Without it the build skips the source map upload.
RUN --mount=type=secret,id=sentry_auth_token \
    SENTRY_AUTH_TOKEN="$(cat /run/secrets/sentry_auth_token 2>/dev/null)" npm run build

# === Stage 2: Rails API ===
FROM ruby:4.0.9 AS backend
WORKDIR /app
ENV RAILS_ENV=production
RUN apt-get update -qq && apt-get install -y nodejs postgresql-client
COPY Gemfile Gemfile.lock ./
RUN gem install bundler && bundle install
COPY . .
# package.json builds into ../public (outDir), i.e. /public in the frontend stage.
COPY --from=frontend-build /public ./public
# Render sets PORT (10000); Puma and `rails server` both read it.
EXPOSE 10000
CMD ["rails", "server", "-b", "0.0.0.0"]