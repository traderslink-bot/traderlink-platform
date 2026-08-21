# Links AI Chat quality feedback progress

## Current checkpoint — 2026-08-21

- [x] Owner approved private quality capture for every failed/unavailable Links
  answer and a small **Not helpful** action below each completed Links answer.
- [x] Owner clarified that every quality case must carry surrounding
  conversation context, not only the selected bubble.
- [x] Locked the bounded snapshot: trigger exchange plus up to six messages on
  either side when available, capped at thirteen ordered messages.
- [x] Add migration and scoped immutable quality-case persistence.
- [x] Add automatic capture for failed/blocked and explicitly unavailable
  deterministic answers, plus the trader flag route.
- [x] Add the small Links action, owner-only quality queue and persistent
  owner-admin alert count.
- [x] Apply the protected migration with the concurrent Press Releases
  migration: `0070_news_press_release_dashboard`, then
  `0071_coach_ai_chat_quality_feedback`.
- [x] Run focused low-resource verification for immutable context capture,
  automatic failure plus trader-flag idempotency, and owner-queue reads.
- [ ] Complete owner visual review of the chat action and quality queue.

## Notes

- `Not helpful` is the approved concise trader-facing label.
- Automatic failure capture must include the triggering question and the
  immediately available preceding context; later messages cannot be invented.
- Existing private conversation text remains private. The owner queue is not a
  general workspace-admin surface.
- The owner-admin shell count is the in-app notification. It increments for
  each unresolved case and links directly to the dedicated Links AI Chat queue.

## Protected migration checkpoint

- The combined 0070/0071 protected migration completed under one exclusive
  writer checkpoint. The verified pre-backup/restore is
  `pre-0070-0071-20260821T003306Z`; the verified post-backup/restore is
  `post-0070-0071-20260821T003542Z`.
- The database now has 71 migrations. The migration registry, schema digest,
  foreign-key check, quick check, integrity check, table counts, page geometry
  and recovery authority all matched; the five new Press Releases and Links
  tables began empty.

## Focused verification

- `verify-links-ai-chat-quality-feedback.ts` passed against a disposable
  71-migration database. It proves one immutable quality case carries the
  ordered saved context around a failed answer, a trader flag enriches rather
  than duplicates that case, both event sources persist, and the owner queue
  returns the open case.
- Focused no-emit TypeScript, focused ESLint and `git diff --check` passed. No
  provider request, port 3010 process, production deployment or journal write
  occurred in this feature acceptance.
