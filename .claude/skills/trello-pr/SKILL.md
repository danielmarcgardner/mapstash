---
name: trello-pr
description: Push the current ticket branch, open a GitHub PR with gh against the branch it was branched from (main or a parent feature branch), and move the Trello card to Code Review. Use after /trello-commit, or for "open a PR", "push this up", "ship this ticket", /trello-pr.
---

# Trello PR

Push the branch, open the PR, and move the card to Code Review.

- Repo: `danielmarcgardner/mapstash` (GitHub). PRs are opened with the `gh` CLI. If `gh auth status` fails, ask the user to run `! gh auth login` and stop until they have.
- Code Review list ARI: `ari:cloud:trello::list/workspace/6aea1042a8361631f564a731/6aea10f9a0fcae53bb549b03` (if it fails, `trelloReadList` `list_by_board` on board `ari:cloud:trello::board/workspace/6aea1042a8361631f564a731/6aea10eb77c9855518cf1cbc` and match "Code Review").

## 1. Gather
```bash
branch=$(git branch --show-current)
card=$(git config branch.$branch.trello-card)
title=$(git config branch.$branch.trello-title)
base=$(git config branch.$branch.parent || echo main)
```
- If you're on `main`, stop.
- If `card` is empty, ask for the card URL (and save it with `git config`).
- If there are uncommitted changes, ask whether to run `/trello-commit` first.
- **Base check:** if `base` isn't `main`, tell the user the PR will target `<base>` (a stacked PR). If the parent config is missing, find the likely parent (the local branch whose tip is the closest ancestor of HEAD, e.g. by comparing `git merge-base --is-ancestor` results and commit distance) and confirm it with the user before using it.

## 2. Push
- If `base` isn't `main` and doesn't exist on origin (`git ls-remote --exit-code --heads origin <base>`), tell the user that the parent needs to be pushed first, and offer to push it. `gh pr create` fails against a base that isn't on GitHub.
- `git push -u origin "$branch"`. Never force-push unless the user asks.

## 3. Open the PR
If `gh pr view "$branch" --json url,baseRefName` already finds an open PR, the push above updated it. Reuse its URL and skip to step 4. If its base doesn't match `base`, tell the user.

Otherwise, build the description from the card: read it with `trelloReadCard` `get` (this also gives you the card ARI for step 4). Body:

```
Trello: <card url>

## Summary
- <1–4 bullets on what changed, from `git log <base>..HEAD` and the diff>

## Acceptance Criteria
<the card's Acceptance Criteria checklist, copied>

<PR attribution line your instructions require, if any>
```

Write the body to a file in your scratchpad, then run:
```bash
gh pr create --base "$base" --head "$branch" --title "$title" --body-file <body file>
```
Keep the PR URL it prints.

## 4. Move to Code Review (background agent)
Only once the PR exists, spawn a background agent (`Agent`, `model: "haiku"`):
> Use the Trello MCP tool `trelloWriteCard` with action "move", cardId `<card ARI>`, listId `<Code Review ARI>`. Load it with ToolSearch first if needed. Then post a comment on the same card (action "add_comment") with the text `PR: <PR url>`. Report only success or the error.

If it fails, tell the user in one line.

## 5. Report
Reply in three lines: the branch pushed, the PR URL (with its base), and the card's new list.

## 6. Hand off
Ask: "Run `/pr-review <PR number>` to review it?" If the user says yes, run it with the PR number.
