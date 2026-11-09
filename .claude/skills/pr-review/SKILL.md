---
name: pr-review
description: Review a mapstash pull request as a senior Rails + React developer, covering bugs, edge cases, security, performance, readability and maintainability. Posts one GitHub review with inline comments a person can act on and a clear verdict (✅ approved or ❌ changes requested), then notes the verdict on the Trello card. Use for "review PR 38", "review this PR", "code review my branch", "is this PR good to merge", /pr-review, or right after /trello-pr opens a PR.
argument-hint: <PR number | PR URL | path to .diff> [--dry-run]
# Run in a fresh subagent so the reviewer never sees the session that wrote the PR.
context: fork
agent: general-purpose
---

# PR Review

Review a PR like a senior Rails and React developer who has to live with this code: someone who wants it correct, safe and easy to change later, not someone hunting for things to say. A review is useful when every comment is true, explains why it matters, and tells the author what to do.

You run as an independent reviewer with no memory of how this PR was written. Judge it only from the PR, the code and the card. Explanations in the PR description are claims to verify, not facts. Don't edit repo files, commit or check out branches.

## 1. Target
`$ARGUMENTS` is one of:
- a PR number or URL;
- nothing, meaning the PR for the current branch (`gh pr view --json number`);
- a path to a `.diff` file, for an offline review. That implies `--dry-run`, there's no CI or GitHub context, and you read surrounding code from the local checkout.

With `--dry-run`, write the review to files (step 6) and print it, but post nothing to GitHub or Trello.

## 2. Gather context (don't touch the working tree)
```bash
gh pr view N --json number,title,body,author,baseRefName,headRefName,headRefOid,files,url
gh pr diff N
gh pr checks N            # failing required checks count as a blocker
git fetch -q origin pull/N/head
git show FETCH_HEAD:<path> # full file at the PR's head
```
Read each changed file in full, then the code it connects to: the model and serializer behind a controller, routes, the RTK Query slice a component calls, the specs. Most real bugs sit where the diff meets code it didn't change, so a review of the diff alone misses them. Read the PR description and its `Trello:` card (with `trelloReadCard` `get`) so you judge the change against what it was meant to do.

If an earlier review from this agent exists (`gh api repos/danielmarcgardner/mapstash/pulls/N/reviews`, body starting with `## ✅` or `## ❌` and containing "by review agent"), this is a re-review. Check each earlier blocker against the new code and say which ones are resolved. Don't repeat comments on lines that haven't changed.

## 3. Review
Read `references/checklist.md`; it lists what tends to go wrong in this stack and this codebase. Use it as a lens, not a form to fill in. Consider each area:

- **Bugs and edge cases:** nil or empty input, records that belong to someone else, duplicates, ordering, timezones, failed requests, double submits.
- **Security:** authorization scoping, strong params, data exposed through serializers.
- **Performance:** N+1 queries, missing indexes, unbounded queries, re-renders or refetches in loops.
- **Tests:** new logic or a new endpoint without a spec that would catch it breaking.
- **Readability and maintainability:** naming, functions or components doing too much, duplicating something that already exists in the codebase, dead code.

**Review the change, not the whole codebase.** Reading surrounding code will turn up problems that were already there. Only block on them when this PR depends on them or makes them worse. Otherwise, list them briefly in the body under "Outside this PR", so the author isn't asked to fix old code to get this change merged.

**Verify before you write.** For each possible finding, trace it in the code until you can describe the concrete failure. If you can't, drop it, or ask it as a question when it's genuinely worth the author's time. A false "Blocking" costs more trust than a missed nit.

## 4. Write comments a person can act on
Every comment has three parts:

```
**Blocking:** <what's wrong, in one sentence>

<why it matters: the concrete scenario, e.g. "Any logged-in user can delete another user's place by changing the id in DELETE /api/places/:id.">

<how to fix it: a suggestion block when the fix is a few lines, otherwise one or two sentences pointing at the approach or an existing helper>
```

- Severity tags:
  - `**Blocking:**` for a bug, a security hole, data loss, unhandled edge cases users will hit, failing CI, or new logic with no tests.
  - `**Suggestion:**` for readability, maintainability or performance issues that don't break anything yet.
  - `**Nit:**` for style or taste.
  - Readability and performance only become Blocking when the harm is concrete, e.g. an N+1 on an index endpoint that grows with user data.
- Use GitHub suggestion blocks for small fixes. The content replaces the commented line(s) exactly, so match the indentation:
  ````
  ```suggestion
  @place = current_user.places.find(params[:id])
  ```
  ````
- Write the way a helpful colleague talks: direct, specific and not condescending. Skip "consider maybe possibly". Say what you'd do.
- At most about 5 nits. Fold repeats into one comment: "same in X and Y".
- If something is done well and not obvious, say so in one line in the summary. Skip filler praise.

## 5. Verdict
- **✅ Approved** when there are no Blocking findings and CI isn't failing. Suggestions and nits don't block.
- **❌ Changes requested** otherwise.

Review body:
```
## ✅ Approved by review agent        (or: ## ❌ Changes requested by review agent)

<1–2 sentences: overall take on the change>

**Blocking (n)**
- `path:line`: <one-line summary>
**Suggestions (n)** · **Nits (n)**

<findings that couldn't be placed inline, each with `path:line`>

<sub>Reviewed: <n> files · CI: <passing|failing|pending|none> · head <short sha></sub>
```
Leave out the Blocking section when it's empty.

## 6. Post (or write, for --dry-run)
GitHub doesn't let the PR author approve or request changes on their own PR, and `gh` is logged in as the author. So post a single **COMMENT** review that carries the verdict in its body. One review means GitHub sends one notification.

Build `review.json` in your scratchpad:
```json
{
  "commit_id": "<headRefOid>",
  "event": "COMMENT",
  "body": "<review body>",
  "comments": [
    { "path": "app/controllers/api/places_controller.rb", "line": 42, "side": "RIGHT", "body": "<comment>" },
    { "path": "...", "start_line": 10, "line": 14, "side": "RIGHT", "body": "<multi-line comment>" }
  ]
}
```
- `line` is the line number in the new version of the file, and it has to fall inside a diff hunk. A finding outside the diff goes in the review body with `path:line`.
- Post it: `gh api repos/danielmarcgardner/mapstash/pulls/N/reviews --method POST --input review.json`. If GitHub rejects a comment's position (422), move those comments into the body and post once more.
- **--dry-run:** write `review.json` and a readable `review.md` (the body, followed by each comment under its `path:line`) to the output folder you were given, or to your scratchpad. Don't post.

## 7. Trello
If the PR body has a `Trello:` card URL and this isn't a dry run, call the Trello MCP tool `trelloWriteCard` yourself (load it with ToolSearch first) directly with action "add_comment", cardId `<card ARI from trelloReadCard>`, text `Review agent: <✅ approved | ❌ changes requested (n blocking)>: <review URL>`. If it fails, include the error in your report.

The card stays where it is. Whoever merges the PR moves it.

## 8. Report
Your final message is returned to the session that invoked you. Include the verdict, the number of findings by severity, the blocking findings as one line each with `path:line`, the review URL, and whether the Trello comment was posted. If changes were requested, end with: "Want me to fix the blocking findings on the branch?" The calling session relays the report and fixes only when the user asks.
