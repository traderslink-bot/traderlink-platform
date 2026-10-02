# Premium swing trade plan authoring

Owner approved October 1, 2026 after product QA. Separate from Watchlist, Swing
Tracker and Swing Analyzer. Preserve the existing CRML idea and both public aliases.
Progress: [implementation record](premium-swing-plan-authoring-progress.md).

## Complete controlling inventory

1. Owner administration under Journal Admin: create/list/edit plans. The left-nav
   Swing Ideas management link is owner-account-only. No ordinary member sidebar
   link, dashboard catalogue or public index. Members access individual plans through
   Discord share links for now. Short random ticker-free URLs; server Premium access.
2. Company details via existing Finnhub profile helper, fetched on owner request.
   Missing provider data never blocks publication. Owner-editable saved fields;
   refreshing offers data for review rather than silently replacing corrections.
3. Initial sections: Company details, Trade thesis, DD & research, Entry & exit plan,
   Key levels, Risks. Custom titled sections; add/reorder/hide/delete; empty sections omitted.
4. Rich text: headings, bold, lists, links, images. Server validates document shape
   and safe URLs; no executable HTML. Preserve owner wording without AI rewrites.
5. Versioned drafts, save/close, unsaved-change protection, actual-page preview.
   Published research remains unchanged while a revision is being drafted.
6. Dedicated public teaser headline, embed title and description; generic TradersLink
   image. Never derive public fields from ticker, thesis, research or private images.
   Preview locked page and both Discord messages/embeds before explicit send.
7. Premium channel message: ticker and owner thesis excerpt, full-plan CTA/link.
   Free channel: required owner-written custom comment plus link only. No automatic
   private excerpt. Owner can correct all public teaser/message fields before send.
8. Page publication separate from sending. Draft save/ordinary edits never notify.
   Dated updates preserve original research, optionally notify premium channel.
   Free updates always require separate explicit action and custom comment.
9. Close/reopen, optional closing summary and optional notification. Closed plans remain
   accessible to Premium members with history. Closing is not deleting.
10. Durable channel-specific delivery receipts and frozen content. Retry only confirmed
    failures; uncertain responses remain visible for owner review rather than blind
    duplicate sends. Channel failure cannot undo page publication or resend other channel.
11. Existing visit tracking extends to each published plan/revision. Distinguish known
    member versus anonymous visits; preserve history and existing account deletion policy.
12. Private responses no-store; no private page/RSC/API/metadata/search/PWA leakage.
    Existing owner auth and Premium semantics, no new bot/Whop verification gate.
13. Help, plan/progress, focused low-resource QA, allowlisted local checkpoints and
    coordinator-owned guarded migration/release. No Watchlist/Analyzer/runtime changes.

## Implementation decisions

- Store full versioned content separately from public teaser columns. Resolve public
  slug/teaser before access; load published research only after Premium authorization.
- One current draft and immutable published revisions. Optimistic draft revision
  prevents a stale tab silently overwriting newer work; preserve submitted edits on error.
- Existing hardcoded idea remains fallback until explicitly imported to editor; no
  silent rewrite, republishing, URL change or fabricated historical versions.
- Publishing accepts owner content without market-analysis validation, mandatory DD
  sections, AI confidence gates or return/performance calculations.
- No AI or live chart/quote polling. Finnhub snapshot is company information only.
- Need coordinator migration allocation and owner channel choice; secrets remain
  server-side, never stored in public documents/client payloads.

## Acceptance cases

Draft vs published isolation; original idea fidelity; add/hide/reorder sections; safe
rich text and images; dirty-close handling; stale-tab conflict; empty section omission;
provider unavailable; owner corrections preserved; Premium/Free/anonymous metadata,
HTML/RSC and API access; short/legacy URLs; dated update/close/reopen history; premium
and free message isolation; delivery success/failure/uncertainty/retry; member/anonymous
visits and filters; mobile/desktop/light/dark layout. No real sends without explicit
owner test action. Hosted visual approval remains distinct from code verification.
