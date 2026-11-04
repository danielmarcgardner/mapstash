# MapStash

MapStash is an app for saving your favorite places for future adventures: a Rails 8 API with a React + Vite client, run locally with Docker Compose.

## Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/), running
- `make`, which comes with macOS and most Linux distros

## First-time setup

1. **Create your env file**
   ```bash
   cp .env.example .env
   ```
   Then fill in `.env`:
   - `JWT_SECRET_KEY`: any long random string, e.g. the output of `openssl rand -hex 64`
   - `VITE_GOOGLE_MAPS_API_KEY`: a Google Maps JavaScript API key. The app runs without one, but the map won't render.
   - `DATABASE_URL`: leave as is. It points at the `db` container.

2. **Build, install, migrate and seed**
   ```bash
   make build    # build the backend image
   make setup    # bundle install + create and migrate the database
   make seed     # load sample data (safe to re-run)
   ```

3. **Start everything**
   ```bash
   make up
   ```

| What | URL |
|---|---|
| App (Vite dev server) | http://localhost:3001 |
| API (Rails) | http://localhost:3000 |
| Health check | http://localhost:3000/api/up |

**Seed login:** `test@example.com` / `12345678`

## Everyday commands

| Command | Does |
|---|---|
| `make up` | Start db, backend and frontend (Ctrl-C to stop) |
| `make stop` | Stop and remove the containers (data is kept) |
| `make logs` | Tail all logs |
| `make console` | Rails console (while `make up` is running) |
| `make bash` | Shell in the backend container |
| `make seed` | Re-seed sample data |

## Running checks

```bash
# Backend tests. Override DATABASE_URL: .env points at the dev database.
docker-compose run --rm -e RAILS_ENV=test \
  -e DATABASE_URL=postgres://postgres:postgres@db:5432/mapstash_test \
  backend sh -c "bin/rails db:prepare && bundle exec rspec"

# Backend lint + security scan
docker-compose run --rm backend bin/rubocop
docker-compose run --rm backend bin/brakeman --no-pager

# Client lint + typecheck
docker-compose run --rm frontend sh -c "npm install && npm run lint && npx tsc -b"
```

## Troubleshooting
- **`docker-credential-desktop: executable file not found`**: add Docker Desktop's tools to your PATH: `export PATH="/Applications/Docker.app/Contents/Resources/bin:$PATH"`.
- **Port already in use (3000, 3001 or 5432)**: another app, or another copy of this project, is using it. Stop that, then `make up` again.
