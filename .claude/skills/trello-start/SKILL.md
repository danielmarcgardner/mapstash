---
name: trello-start
description: Start work on an Eng Work Trello ticket. Takes a Trello card URL, moves the card to Planning, plans the work in plan mode, and after the plan is approved moves the card to In Progress, creates a confirmed feature branch and implements the plan. Use for "start this ticket", "work on <trello.com/c/...>", "pick up this card", /trello-start.
argument-hint: <trello card URL>
---

# Trello Start

Take a Trello card from Backlog to implemented code on its own branch.

**Eng Work board lists** (board ARI `ari:cloud:trello::board/workspace/6aea1042a8361631f564a731/6aea10eb77c9855518cf1cbc`):
- Planning: `ari:cloud:trello::list/workspace/6aea1042a8361631f564a731/6aea2b5439ae6cfb95f9c8fe`
- In Progress: `ari:cloud:trello::list/workspace/6aea1042a8361631f564a731/6aea10f6ee79fdcef087f507`
- If an ARI fails, call `trelloReadList` `list_by_board` on the board ARI and match the list by name.

## 1. Read the card
Input is `$ARGUMENTS`, a Trello card URL. If it's missing, ask for it. Call `trelloReadCard` `get` with the URL. Keep the card's `id` (ARI), `name`, `url`, description, checklists and comments; they are the spec.

## 2. Move to Planning (agent)
Spawn an agent (`Agent`, `model: "haiku"`):
> Use the Trello MCP tool `trelloWriteCard` with action "move", cardId `<card ARI>`, listId `<Planning ARI>`. Load it with ToolSearch first if needed. Report only success or the error.

Wait for it to finish **before** entering plan mode. Plan mode blocks writes for subagents too, so a move still in flight when plan mode starts fails. If it reports an error, tell the user in one line and carry on.

## 3. Plan in plan mode
Call `EnterPlanMode`, then read the code the card touches (Rails API: `app/models`, `db/migrate`, `app/controllers/api`, `app/serializers`, `config/routes.rb`, `spec/`; client: `client/src/components`, `client/src/pages`, `client/src/state/api`). Write a plan that covers each Task and Acceptance Criteria item on the card, names real files, and includes the specs to add. Put the proposed branch name (step 5) at the top of the plan. Present it with `ExitPlanMode`.

If the user rejects the plan or asks for changes, revise and present it again. Nothing below runs until they approve.

## 4. Move to In Progress (background agent)
On approval, spawn another background `haiku` agent the same way, with the In Progress list ARI.

## 5. Create the branch
- Proposed name: `feature/<slug>`, where the slug is the card name in lowercase kebab-case, ASCII only, at most about 50 characters (e.g. "Add note field to lists API" → `feature/add-note-field-to-lists-api`).
- Ask the user to confirm the branch name with `AskUserQuestion` (proposed name as the first option; they can type another through Other), even if it was in the plan, because this is where the name gets fixed.
- If the working tree has uncommitted changes, say so and ask whether to carry them onto the new branch before creating it.
- Record the parent branch *before* switching: `parent=$(git branch --show-current)`.
- Create the branch and save the metadata the later skills read:
  ```bash
  git switch -c <branch>
  git config branch.<branch>.trello-card "<card url>"
  git config branch.<branch>.trello-title "<card name>"
  git config branch.<branch>.parent "$parent"
  ```
  The parent is whatever branch you were on. It's `main` most of the time, but stacking on a feature branch is intentional, and `/trello-pr` uses it as the PR base.

## 6. Implement
Carry out the approved plan, including the specs. Stick to the plan; if something forces a real deviation, tell the user what changed and why.

## 7. Hand off
Summarize what changed in a few lines, then ask: "Run `/trello-check` to lint and test?" Run it if they say yes.
