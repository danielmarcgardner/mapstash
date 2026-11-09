---
name: trello-commit
description: Commit the current ticket's work using the Trello card title as the commit message. Use after /trello-check passes, or for "commit this ticket", "commit with the card title", /trello-commit.
---

# Trello Commit

Commit the branch's work with the Trello card's title as the commit message.

## 1. Find the title
```bash
branch=$(git branch --show-current)
git config branch.$branch.trello-title
```
If it's empty (the branch wasn't made by `/trello-start`), ask the user for the card URL, read it with `trelloReadCard` `get`, and save both values:
`git config branch.$branch.trello-title "<name>"` and `git config branch.$branch.trello-card "<url>"`.

If you're on `main`, stop: ticket work belongs on a feature branch.

## 2. Review what goes in
Run `git status` and `git diff --stat`. Stage the ticket's changes by path (`git add <paths>`), not `git add -A`. Leave out anything unrelated, and anything that looks like secrets or local junk (`.env*`, `log/`, `tmp/`, `storage/`, editor files). If something is ambiguous, ask.

## 3. Commit
The subject line is the card title, exactly as written. Add the attribution trailer your instructions require, after a blank line:

```bash
git commit -F - <<'EOF'
<card title>

<attribution trailer, if any>
EOF
```

If a pre-commit hook fails, fix the problem and make a new commit. Don't use `--no-verify` and don't amend.

## 4. Hand off
Show `git log -1 --stat`. In chain mode (reached from `/trello-start`), run `/trello-pr` now. Otherwise ask: "Run `/trello-pr` to push and open the PR?" and run it if they say yes.
