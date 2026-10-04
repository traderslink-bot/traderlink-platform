# Per-ticker Premium analysis

Status: owner-approved behavior implemented in an isolated source overlay; focused checks complete, integrated build/rendered acceptance outstanding. Not deployed.

Progress: [implementation record](watchlist-premium-analysis-progress.md).

## Approved behavior

- Each ticker has an owner-only **Premium-only analysis** toggle in Watchlist Admin. Default off; do not restrict existing tickers on rollout.
- Off preserves current analysis access. On restricts analysis prices to Premium members and the owner, without changing access to the ticker page, indicator card, potential path, company information or trader notes.
- Free viewers retain an analysis preview with concealed price placeholders. Real restricted values must not be shipped underneath a CSS blur.
- Show once beneath **TradersLink Analysis**, in orange, slightly larger than body copy:
  **Some analyses are free; this one is reserved for Premium members. Access Premium**
- Only **Access Premium** is a link, bold and underlined, to `https://whop.com/traderslink-1049/premium-access-2026`.
- Authorized Premium/owner viewers get the ordinary card without the notice or blur.
- No AI request, republishing or notification is caused by toggling access.

## Complete implementation inventory

1. Persist an owner-audited per-ticker access setting using a registered Platform migration, allocated with the release coordinator. Default absent rows to free only after the settings store is successfully read; read failures must not expose protected content.
2. Reuse the application's current authenticated Premium entitlement and owner authorization. Do not substitute ordinary dashboard membership or the generic analysis-feature grant for Premium status.
3. Add the compact per-ticker admin toggle with save/error feedback. Keep selection stable during admin polling; do not reset or publish analysis drafts.
4. Apply server-side projection to ticker page, detail API, archive page and analysis-history routes. Confirm list, stream, recap, public preview and image routes cannot bypass analysis access. Do not change unrelated cards' legitimate price data.
5. Build an explicit preview presentation model from current and simple analyses: preserve visible sections, ordering and non-price prose; omit raw JSON, evidence, sources or hidden sections. Conceal structured prices and price references in prose. Never send the unrestricted payload and rely on browser styling for protection.
6. Render concealed prices with accessible fixed placeholders; show the approved notice once. Preserve existing fonts/layout otherwise, including mobile.
7. Preserve the restriction through detail polling/reconciliation; switching a ticker to restricted must clear previously retained full analysis from subsequent responses and client state.
8. Update Watchlist Help. Keep existing publication/Discord image behavior unchanged unless the owner separately requests changes; explicitly note that already published images cannot be recalled by a webpage access toggle.
9. Verify free/Premium/owner access, off/on transitions, no-analysis tickers, full/simple formats, prose prices, multiple updates, archive/history, polling and failure handling at a focused checkpoint. No real posts or production writes for verification without authorization.
10. Package narrow commits against the current integration parent, preserving the prior editable-post checkpoints and unrelated dirty work. Deployment remains a separate owner instruction.

## Source findings / design QA

- The local checkout is behind its integration parent and contains extensive unrelated work. Do not overwrite shared files from the checkout or blanket-stage them.
- Inspected integration parent: `63290941b32b7b41f332c7ed83cc91ff43633146` (local `origin/main`; recheck before packaging).
- Existing `watchlistDetailProjection` deletes `tradersLinkAiRead` and `liveTraderRead` for denied analysis access. It does not implement a price-concealed preview.
- That projection is called from the detail API, detail page, archive page and client reconciliation. All must retain existing membership gates while adding the independent Premium price restriction.
- Numeric levels also occur in prose. Structured-field blurring alone does not meet the requested behavior.
- Owner explicitly authorized coordinator contact. Allocated migration: `0155_platform_watchlist_premium_analysis_access`, predecessor `0154_platform_premium_swing_plan_authorship`. Exact source parent: `3fdd4241777e825195299c899754f933f1c2acaa`. Do not release 0155 ahead of 0154.
