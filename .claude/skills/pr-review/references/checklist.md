# Review checklist: mapstash (Rails 8 API + React/TypeScript)

This lists what most often goes wrong in this stack. Use it as a lens. Every finding still needs a concrete failure behind it.

## Codebase conventions to hold PRs to
- API controllers live in `app/controllers/api/`, run `before_action :authenticate_user!`, and scope everything through `current_user` (`current_user.lists`, `current_user.lists.build(...)`). See `Api::ListsController`.
- Validation failures are rendered as `{ errors: record.errors.full_messages }` with `status: :unprocessable_content` (not `:unprocessable_entity`, which Rack deprecated).
- JSON goes through serializers in `app/serializers` (active_model_serializers).
- Auth is Devise + devise-jwt. The client sends `Authorization: Bearer` from `client/src/state/api/commonApi.ts` (`baseQuery`/`prepareHeaders`).
- The client uses RTK Query slices in `client/src/state/api/*Api.ts`, Mantine UI and `@mantine/form`, with types in `client/src/types`.
- Specs are RSpec: request specs in `spec/requests`, model specs in `spec/models`.

## Rails
**Authorization and security**
- `Model.find(params[:id])` in a user-owned resource means any logged-in user can read, change or delete other users' records. Use `current_user.<assoc>.find`.
- Join records (`ListPlace`, `PlaceTag`): check that *both* sides belong to `current_user`, not just one.
- Strong params: no `permit!`, no permitting `user_id` or other ownership fields.
- Serializers: new attributes don't expose another user's data or internal fields (e.g. `jti`, `encrypted_password`).
- Raw SQL with interpolation is SQL injection. Use bound parameters or Arel.

**Correctness and edge cases**
- `find` raises 404, while `find_by` returns nil. Check that nil is handled where `find_by` is used.
- `save`/`update` return values must be checked, or use the bang version inside a transaction. Silent failures lose data.
- Multi-record writes belong in `ActiveRecord::Base.transaction`.
- Uniqueness needs a DB unique index, not just `validates :uniqueness`, or concurrent requests can create duplicates.
- `rescue => e` or `rescue StandardError` that swallows errors and returns 200 hides bugs.
- Status codes: 201 on create, 204 or 200 on destroy, 422 on validation, 404 on not found. Don't return 200 with an error body.
- Callbacks (`after_save` etc.) with external side effects, like geocoding or mail, cause surprises. Prefer explicit calls or jobs.

**Migrations**
- Reversible (`change` with reversible operations, or `up`/`down`).
- Foreign keys and indexes on new `*_id` columns.
- `null: false` + default on new columns where the app assumes presence. Backfill before adding constraints to tables that have rows.
- No model classes inside migrations, because they break when the model changes later.

**Performance**
- N+1: serializers or loops touching associations (`place.tags`, `list.places`) need `includes`/`preload` in the controller.
- Unbounded `.all` on endpoints that grow with user data. Paginate or limit.
- `count` vs `size` vs `length` inside loops.

**Tests**
- A new endpoint or branch gets a request spec covering success, validation failure, and another user's record (404).
- Pending or empty spec placeholders don't count as coverage.

## React / TypeScript
**Correctness**
- `useEffect`: are the dependencies complete? Is there cleanup for subscriptions, timers and listeners? Is there an effect that only derives state, which should have been computed during render?
- State that duplicates props or RTK Query data drifts out of sync. Derive it instead.
- List `key` must be a stable id, not the array index, when items can be reordered, added or removed.
- RTK Query: handle `isLoading`/`isFetching` and `isError` states. Mutations need `invalidatesTags`, or a cache update that matches the query's `providesTags`, or the UI shows stale data after create, update or delete.
- Async handlers: double submits (disable the button while `isLoading`), and errors from `.unwrap()` caught and shown to the user.
- Conditional hooks or hooks inside loops break the rules of hooks.

**Types**
- `any`, `as` casts and non-null `!` that hide a real `undefined`. Payload types should match the serializer's output.

**UX and accessibility**
- Form inputs have labels (`label` prop on Mantine inputs). Icon-only buttons have `aria-label`.
- Error and empty states exist. Nothing renders `undefined`.

**Maintainability**
- Components over about 150 lines, or doing fetching, state and layout all at once, should be split.
- Duplicating an existing slice, hook or component instead of reusing it.
- Constants and routes belong in `client/src/constants`, not hard-coded strings.

## Cross-cutting
- The client and API agree on field names and shapes (snake_case from Rails vs camelCase in TS).
- Secrets and keys stay out of code. `VITE_*` env vars are public in the bundle.
- Dead code, commented-out blocks and stray `console.log` or `puts`.
