# Global failure and recovery display

Owner-approved October 6, 2026. Source implementation complete; deployment held.

- AI Controls → Analysis display → Show failure and recovery section. Global, default off (including older settings with no field).
- Hides the whole Failure and recovery section and its downside checkpoints. The separate Momentum failure level remains unchanged.
- Public ticker card and owner inline preview follow the flag. Existing per-section hidden choices remain respected when globally on. Simple analysis has no separate failure/recovery section and is unchanged.
- Persists in Runtime settings, propagates through existing website payload/state, no migration. Saved generated/edited content remains intact; no AI requests or Discord/member notifications are made by the switch.
- Immediate updates exclude private tickers and unpublished drafts. Existing public tickers receive display-only patches; future publications carry the setting. Stored state defaults hidden before Runtime update.
- Verification: focused persistence, async API, invalid boolean, publication filter, TS syntax, embedded script parsing and public/editor gate checks. Hosted browser and delivery acceptance pending.
- React review: boolean prop only, no new fetch/effect in either card or editor, no change to existing hook order, dynamic import or owner edit payload.

Release chain: Runtime starts from cleanup 5d55f26b and includes pending global notification setting source. Platform starts from f7935c15 and preserves both notification Help changes. Coordinator must verify cumulative allowlist and deploy Platform before Runtime when the owner releases the hold. IPDN selection work remains separate and unfinished.
