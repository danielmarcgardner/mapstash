# === Stage 1: Build Frontend ===
FROM node:20 AS frontend-build

WORKDIR /client

COPY client/package*.json ./
RUN npm install

COPY client .

RUN npm run build

# === Stage 2: Rails API ===
FROM ruby:3.2

WORKDIR /app

RUN apt-get update -qq && apt-get install -y nodejs postgresql-client

COPY Gemfile Gemfile.lock ./
RUN gem install bundler && bundle install

COPY . .

# Copy built frontend into public folder
COPY --from=frontend-build /client/dist ./public

EXPOSE 3000
CMD ["rails", "server", "-b", "0.0.0.0"]