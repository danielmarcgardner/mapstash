---
name: trello-check
description: Run mapstash's linters and tests in Docker (rubocop, brakeman, rspec, client eslint and tsc) to confirm nothing is broken before committing. Use after finishing work on a ticket, or for "run the checks", "lint and test", "make sure nothing is broken", /trello-check.
---

# Trello Check

Run every check CI runs, plus the test suite, inside Docker.

## 1. Docker up
Run `docker info >/dev/null 2>&1`. If it fails, ask the user to start Docker Desktop and stop until they confirm it's running.

Then start the database: `docker-compose up -d db`.

If a build fails with `docker-credential-desktop: executable file not found`, prefix the commands with `export PATH="/Applications/Docker.app/Contents/Resources/bin:$PATH";` (the shell doesn't have Docker Desktop's helpers on PATH).

## 2. Run the checks
Run each check and keep its exit code and output. Run all of them even when one fails, so the user sees everything at once.

```bash
# Backend lint + security (same as CI)
docker-compose run --rm backend bin/rubocop
docker-compose run --rm backend bin/brakeman --no-pager

# Backend tests. Override DATABASE_URL: .env points it at the dev database,
# and it would otherwise win over database.yml and run specs against dev data.
docker-compose run --rm -e RAILS_ENV=test \
  -e DATABASE_URL=postgres://postgres:postgres@db:5432/mapstash_test \
  backend sh -c "bin/rails db:prepare && bundle exec rspec"

# Client lint + typecheck
docker-compose run --rm frontend sh -c "npm install --no-audit --no-fund && npm run lint && npx tsc -b"
```

The first run may be slow while images build and gems and npm packages install.

## 3. Fix or report
- **All green:** say so in one line per check.
- **Failures:** show the failing check and the relevant lines of output. If the failure comes from this branch's changes (`git diff <parent>...HEAD` plus uncommitted work, where the parent is `git config branch.$(git branch --show-current).parent`, default `main`), fix it and run that check again. RuboCop offenses in changed files can be fixed with `bin/rubocop -a <files>`; read what changed afterward. If the failure exists on the parent too, report it and don't fix it here, because it's out of scope for this ticket.
- Never weaken or delete a test to make it pass. If the test looks wrong, ask the user.

## 4. Hand off
When everything passes: in chain mode (reached from `/trello-start`), run `/trello-commit` now. Otherwise ask: "Run `/trello-commit`?" and run it if they say yes. If a check still fails after fixing what this branch caused, stop and report.
