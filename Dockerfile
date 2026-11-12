# === Stage 1: Build Frontend ===
FROM node:22 AS frontend-build

WORKDIR /client
COPY client/package*.json ./
RUN npm install
COPY client .
# Passed from Kamal's builder args; Vite reads it from the environment at build time.
ARG VITE_SENTRY_DSN
RUN npm run build
# Removed the erroneous COPY referencing a non-existent builder

# === Stage 2: Rails API ===
FROM ruby:4.0.9 AS backend
WORKDIR /app
RUN apt-get update -qq && apt-get install -y nodejs postgresql-client
COPY Gemfile Gemfile.lock ./
RUN gem install bundler && bundle install
COPY . .
# Copy built frontend into public folder
COPY --from=frontend-build /client/dist ./public
EXPOSE 3000
CMD ["rails", "server", "-b", "0.0.0.0"]