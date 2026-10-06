# First analysis notification progress

## Confirmed cause

Runtime preview passes `alreadyListed` into the analysis-update renderer. That flag includes acknowledged ticker-only listings. Renderer unconditionally used Analysis updated and the follow-up explanation; Platform push/email did the same for notificationKind analysis. Ticker publication was being mistaken for prior analysis publication.

## Correction

- Existing context receives optional hasPreviousAnalysis, derived from actual website-acknowledged analysis approvals, not price alone or ticker visibility.
- Ticker-only approvals, unpublished drafts and failed/unacknowledged website delivery do not establish a previous analysis.
- First analysis receives Analysis published wording in Discord/push/email. Genuine updates retain existing wording and attribution.
- Existing serialized context remains compatible. No new event kind, migration, publication gate or checkbox change. Frozen prior approvals are not rewritten or resent.
- Help now explains first versus updated announcements.

## Verification

Focused Node assertions pass for listing-only then first analysis, subsequent analysis, unpublished approvals, missing-price analysis history, legacy context, Discord owner/automatic attribution, mentions/links, push/email and unchanged initial listing behavior. Initial local test lacked a configured public URL; supplied a test-only URL and reran successfully. No OpenAI calls, live messages, database writes or deployment.

Parents: Runtime c926b396e5f71e347583e23b65321e9b93e58fb1; Platform c4b87986de09bb97438c719dc1910ba7212d7ff6. Exact-parent packaging preserves unrelated dirty work. Source complete, hosted verification pending coordinated release.
