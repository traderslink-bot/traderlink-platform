# AI Chat Persistence API Progress

## Scope

This checkpoint implements the private account-scoped persistence API over
migration `0029_coach_ai_chat_foundation`:

- `GET` and `POST` `/api/coach/chat/conversations` for bounded active/archived
  conversation lists and creation.
- `GET` and `PATCH` `/api/coach/chat/conversations/[conversationId]` for
  private reads and strict `rename`, `archive`, and `restore` actions.
- `GET` `/api/coach/chat/conversations/[conversationId]/messages` for bounded,
  chronological message history.

No message-generation request, provider call, factual tool, UI, migration,
fixture, Journal write, or language-inventory change is included.

## Boundary and validation

- Every handler derives `WorkspaceAccessScope` and the selected Journal
  account through the current server-side request-scope helper. Client payloads
  cannot provide user, workspace, or account identifiers.
- Conversation IDs remain insufficient for access: the existing repository
  verifies active user, workspace membership, selected active account, and
  conversation ownership/account scope for every operation.
- List and history limits are bounded at 100. Cursors are opaque base64url
  JSON envelopes with exact field shapes; their deterministic timestamp/ID or
  sequence values are passed to the repository unchanged.
- Unknown query fields, duplicate query values, malformed cursors, malformed
  JSON, unknown body fields, and unknown PATCH actions are rejected.
- Route errors expose only the safe categories `invalid_request`,
  `access_denied`, `conflict`, and `unavailable`; SQLite, provider, internal,
  account, and private text values are not returned.

## Verification

Focused route tests cover list/create/read/history, cursor and limit
validation, strict PATCH action handling, archive/restore dispatch,
cross-account/inactive-scope denial, and private-text-safe errors.

The slice intentionally does not open or mutate a real application database,
call an AI provider, add a UI, or publish a branch.
