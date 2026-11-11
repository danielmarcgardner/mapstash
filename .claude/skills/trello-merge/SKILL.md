---
name: trello-merge
description: Merge the current ticket's GitHub PR, mark its Trello card complete and move it to Merged, then check out main and pull. Use after a PR is approved, or for "merge this PR", "merge and close the ticket", "ship it", /trello-merge.
---

# Trello Merge

Finish a ticket: merge its PR, close out the card, and get back onto an up-to-date `main`.

- Repo: `danielmarcgardner/mapstash`. If `gh auth status` fails, ask the user to run `! gh auth login` and stop.
- Merged list ARI: `ari:cloud:trello::list/workspace/6aea1042a8361631f564a731/6aea10fc7d8d434028bad3ea` (if it fails, `trelloReadList` `list_by_board` on board `ari:cloud:trello::board/workspace/6aea1042a8361631f564a731/6aea10eb77c9855518cf1cbc` and match "Merged").

## 1. Gather
The input is an optional PR number. Without one, use the current branch.
```bash
branch=$(git branch --show-current)          # or: gh pr view <n> --json headRefName -q .headRefName
card=$(git config branch.$branch.trello-card)
gh pr view "${n:-$branch}" --json number,url,state,baseRefName,headRefName,mergeable,reviewDecision
```
- If you're on `main` and no PR number was given, ask which PR.
- If `card` is empty, look for a `trello.com/c/` link in the PR body (`/trello-pr` writes one). If there's none, ask for the card URL.
- If there are uncommitted changes on the branch, stop and ask. Switching to `main` would carry them along or fail.

## 2. Merge the PR
- If `state` is already `MERGED`, skip to step 3.
- Before merging, stop and report (don't merge) if:
  - `gh pr checks <n>` shows a failing or pending check
  - `reviewDecision` is `CHANGES_REQUESTED`
  - `mergeable` is `CONFLICTING`
- If `baseRefName` isn't `main` (a stacked PR), tell the user it merges into `<base>`, not `main`, and confirm before merging.
- Merge with a merge commit, matching the repo's history: `gh pr merge <n> --merge`.

## 3. Close out the card (background agent)
Read the card with `trelloReadCard` `get` to get its ARI, then spawn a background agent (`Agent`, `model: "haiku"`):
> Use the Trello MCP tool `trelloWriteCard`. Load it with ToolSearch first if needed. First call action "mark_done" with cardId `<card ARI>`, then action "move" with cardId `<card ARI>` and listId `<Merged ARI>`. Report only success or the error for each.

If it fails, tell the user in one line.

## 4. Back to main
```bash
git switch main
git pull --ff-only origin main
git branch -d "$branch"    # merged, so -d is safe; if it refuses, report it and leave the branch
```
If `--ff-only` fails, local `main` has commits that aren't on GitHub. Show `git log --oneline origin/main..main` and let the user decide. Never force it.

## 5. Report
Reply in three lines: the PR merged (or already merged), the card's state (complete, in Merged), and the `main` tip (`git log --oneline -1`).
