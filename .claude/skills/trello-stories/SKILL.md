---
name: trello-stories
description: Turn a technical/feature doc into Backlog stories on the Eng Work Trello board, each with Issue, Task and Acceptance Criteria. Drafts a collaborative Claude Doc for review first; creates cards only after explicit approval. Use for "break this doc into stories", "create trello stories", "plan tickets for this feature", /trello-stories.
argument-hint: <path to doc, URL, or paste it>
---

# Trello Stories

Turn a feature doc into reviewed, approved Trello stories for mapstash.

**Trello targets** (Eng Work board, https://trello.com/b/nkw23Gdb/eng-work):
- Board ARI: `ari:cloud:trello::board/workspace/6aea1042a8361631f564a731/6aea10eb77c9855518cf1cbc`
- Backlog list ARI: `ari:cloud:trello::list/workspace/6aea1042a8361631f564a731/6aea10f1cee9ce65feae4130`
- If the Backlog ARI fails, call `trelloReadList` `list_by_board` on the board ARI and use the list named "Backlog".

## 1. Get the doc
Input is `$ARGUMENTS`: a file path (read it), a URL (fetch it), or pasted text. If none, ask for it. Extract the stated goal of the feature.

## 2. Diagnose against the code
Search and read what the goal touches. Mapstash is a Rails API + React client:
- Backend: `app/models`, `db/migrate` + `db/schema.rb`, `app/controllers/api`, `app/serializers`, `config/routes.rb`, `spec/`
- Frontend: `client/src/components`, `client/src/state/api` (RTK Query slices), `client/src/constants`

Note what already exists, what must change, and what is new. Name real files and classes; don't invent ones that aren't there.

## 3. Break into stories
- Each story is independently mergeable and fits in one PR.
- Typical order: migration/model → API endpoint + serializer → client api slice → UI.
- Order by dependency; say in the Task when a story depends on an earlier one.
- Don't add stories for work the doc doesn't ask for; list those under Open questions instead.

Each story uses this exact format (it becomes the card description):

```
## Issue
<What we're trying to accomplish and why, 1–3 sentences.>

## Task
- <Concrete step naming real files/classes, e.g. add `note` column via migration; permit in app/controllers/api/lists_controller.rb>
- ...

## Acceptance Criteria
- [ ] <Testable, observable outcome>
- [ ] Specs added and passing (rspec and/or client tests as relevant)
```

Card name: a short imperative title, e.g. "Add note field to lists API".

## 4. Publish the planning doc (no Trello writes yet)
Load the `anthropic-skills:docs` skill and follow it to create a Claude Doc titled `<Feature> — Story Plan` containing:
- `Status: Draft — awaiting approval`
- **Summary**: the goal and the code areas involved
- **Stories**: one `###` heading per story (the card name, numbered in order), each with its Issue / Task / Acceptance Criteria
- **Open questions / assumptions**

Give the user the doc link and stop. Reviewers edit and comment in the doc directly.

## 5. Iterate
When asked to revise (or when a doc comment summons you), re-read the current doc, reply to comments in their threads, and apply requested edits in the doc. The doc is the source of truth, not the chat or your earlier draft.

## 6. Create cards, only on explicit approval
Trigger: the user says "approved", "create the tickets" or similar, or the doc Status reads Approved. Never create cards before that.

1. Re-read the current doc.
2. For each story in doc order, call `trelloWriteCard` with `action: "create"`, the Backlog `listId`, `name` = story heading (without the number), `desc` = that story's Issue/Task/Acceptance Criteria markdown, and `pos` = 1, 2, 3… in order.
3. Add each card URL under its story in the doc and set Status to `Tickets created <YYYY-MM-DD>`.
4. Report the card names and URLs in chat.
