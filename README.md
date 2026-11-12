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
| Health check | http://localhost:3000/up |

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
make check
```
This runs RuboCop, Brakeman and RSpec in the backend container, then ESLint, `tsc` and Vitest in the frontend container: the same checks CI runs.

## Production (Render)

The live app is **https://mapstash.fun**, hosted on [Render](https://render.com) for about $13/month. Everything Render runs is defined in [`render.yaml`](render.yaml) (a Render Blueprint):

| Service | Render name | Plan | Cost |
|---|---|---|---|
| Web service (Docker, built from `Dockerfile`) | `mapstash` | `0.5c-512mb` | ~$7/month |
| Postgres | `mapstash-db` | `0.1c-256mb` | ~$6/month |

Don't switch to the free plans: the free web service sleeps after 15 minutes and can't run a pre-deploy command, and free Postgres is deleted after 30 days.

### How a deploy works

1. A push to `main` runs CI (`.github/workflows/ci.yml`). Render deploys only once CI passes (`autoDeployTrigger: checksPass`).
2. Render builds the `Dockerfile`. It passes the service's env vars as Docker build args, so Vite bakes the `VITE_*` values into the client. With the `sentry_auth_token` secret file present, the build also uploads source maps to Sentry and then deletes them from the image.
3. The pre-deploy command `bin/rails db:prepare` runs migrations. On a brand-new database it creates the schema; `db/seeds.rb` does nothing in production.
4. Render starts the new container. It switches traffic over once `/up` returns 200, and keeps the old one running if it doesn't.

### Environment variables

`DATABASE_URL` is wired up by the Blueprint. Enter the rest in the Render dashboard the first time the Blueprint syncs (they're `sync: false`, so they're never in git).

| Variable | Value | Used at |
|---|---|---|
| `DATABASE_URL` | Set automatically from `mapstash-db` | Runtime |
| `RAILS_MASTER_KEY` | Contents of your local `config/master.key` (decrypts `config/credentials.yml.enc`, which holds `secret_key_base`) | Runtime |
| `JWT_SECRET_KEY` | A new long random string (`openssl rand -hex 64`); don't reuse the dev one | Runtime |
| `SENTRY_DSN` | DSN of the `mapstash-server` Sentry project | Runtime |
| `VITE_SENTRY_DSN` | DSN of the `mapstash-frontend` Sentry project | Build |
| `VITE_GOOGLE_MAPS_API_KEY` | Google Maps JavaScript API key | Build |
| `VITE_GOOGLE_MAPS_MAP_ID` | Map ID for Advanced Markers | Build |

Plus one **secret file** (Service → Environment → Secret Files), which a Blueprint can't hold:

| File name | Contents | Used at |
|---|---|---|
| `sentry_auth_token` | A Sentry auth token with `project:releases`, only the token | Build (mounted for the client build step only) |

The app refuses to boot if `JWT_SECRET_KEY` or `DATABASE_URL` is missing, and the deploy log names the missing one. Changing a `VITE_*` value only takes effect after a new deploy, because it's baked in at build time.

### Custom domain and DNS

In Render, add `mapstash.fun` under the service's **Settings → Custom Domains** first. Render adds `www.mapstash.fun` too, redirects it to the root, and issues the HTTPS certificate after verification. All `http://` traffic redirects to `https://`.

Then set these records at the domain registrar:

| Type | Name | Value |
|---|---|---|
| `ALIAS` / `ANAME` (or flattened `CNAME`) | `@` (mapstash.fun) | The service's `onrender.com` host, e.g. `mapstash.onrender.com` |
| `A` (only if ALIAS isn't supported) | `@` | `216.24.57.1` |
| `CNAME` | `www` | The same `onrender.com` host |

Also:
- Replace the registrar's default `A` record (`216.40.34.41`).
- Delete any `AAAA` records, because Render uses IPv4 only.
- Turn off parking or forwarding.

Back in Render, click **Verify**. If it fails, DNS hasn't propagated yet, so wait a few minutes and retry.

The Google Maps key must allow both `https://mapstash.fun/*` and `https://www.mapstash.fun/*` as HTTP referrers, or the map won't load.

### Sentry

Errors, traces and logs go to the `mapstash-server` (Rails) and `mapstash-frontend` (React) projects in the Daniel Gardner organization. Production events are tagged `production`, with the release set to the deployed commit (`RENDER_GIT_COMMIT`). Client stack traces show source file names when the source maps were uploaded, which needs the `sentry_auth_token` secret file.

### Rolling back a deploy

1. In Render, open the `mapstash` service's **Deploys** page.
2. Find the last good deploy and click **Rollback**, then **Rollback to this deploy**. Render reuses that deploy's image and env vars, so there's no rebuild.
3. **Rolling back from the dashboard turns auto-deploy off.** Once `main` is fixed, turn it back on under **Settings**, or new pushes won't deploy.

A rollback doesn't undo database migrations or env var changes made since. Keep migrations backward-compatible: add columns and tables first, and remove them in a later deploy. That way the previous release can still run against the new schema.

## Smoke test

Run this after every production deploy that changes behavior, on a desktop browser and on a phone, against https://mapstash.fun:

- [ ] `https://mapstash.fun` loads the login page, and `http://mapstash.fun` and `https://www.mapstash.fun` both redirect to it.
- [ ] `https://mapstash.fun/up` returns 200.
- [ ] Sign up with a new email. You land on the map.
- [ ] Create a list, then add a place: search a location, add a new tag, put it in the list, save. Its pin appears on the map.
- [ ] Refresh the page. You're still logged in, and the place, tag and list are still there.
- [ ] Filter by the tag, then by the list. Only matching pins show, and clearing the filter shows them all again.
- [ ] Open the place. Its details show the tag and the list.
- [ ] Log out. You're back on the login page, and going to `/` sends you back to login.
- [ ] Refresh on `/login`. The app loads, not a 404.
- [ ] Sentry shows no new errors from the run, beyond any you triggered on purpose.

## Troubleshooting
- **`docker-credential-desktop: executable file not found`**: add Docker Desktop's tools to your PATH: `export PATH="/Applications/Docker.app/Contents/Resources/bin:$PATH"`.
- **Port already in use (3000, 3001 or 5432)**: another app, or another copy of this project, is using it. Stop that, then `make up` again.
