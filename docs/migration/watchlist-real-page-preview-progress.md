# Real CNTB public preview

## Owner-approved scope — September 30, 2026

- Replace the hand-built BKYI approximation with the actual rendered CNTB detail page, from Ticker Details through the end of Indicators.
- Preserve original desktop/mobile responsive markup, fonts, spacing and full-length scrolling; do not shrink the page into one viewport.
- Use the current traderslink.pro homepage header and footer, not the older Academy shell.
- Preserve the join/sign-in panel, member authorization and authenticated Watchlist. No live requests from the dated public example.

## Source implementation complete

The browser-exported CNTB DOM was captured September 30 at 9:50 AM ET. Only the published detail-page subtree through Indicators was exported. Account UI, React/server payloads, draft data, TradingView and subsequent cards were excluded. It is actual responsive HTML with its original stylesheet and locally frozen font assets, not a screenshot or recreated card design. The only content adjustments identify frozen prices as preview data instead of live data and disable background navigation.

The captured document is sandboxed with scripts and connections disabled. The parent measures its actual content height using ResizeObserver so desktop/mobile use one ordinary page scrollbar, without clipping or nested scrolling. No Watchlist API, EventSource, indicator polling, Moomoo call or AI request is mounted in this preview.

Homepage header/footer source: static-landing-site/index.html from f953b319e49b50e6b2cb7a24d242fcedcf581b72. Exact original markup and scoped responsive styles are preserved, with relative links resolved to traderslink.pro. Mobile and Features menus have their original expanded-state behaviour, click-away and Escape handling. The homepage source is not merged into Platform history.

## Verification boundary

Focused strict TypeScript, captured-card boundaries, locally frozen font references, disabled script/network execution, responsive shell rules, and an exact comparison proving the authenticated page branch is unchanged all pass. No broad test suite, local server or production build was used for this UI slice. Browser policy prevents opening local HTML; therefore integrated mobile/desktop visual acceptance must occur on the hosted candidate. This is not yet a deployment or owner visual acceptance claim.

Help requires the dated example name to change from BKYI to CNTB; the exact-parent release candidate includes that update. Authenticated detail/index rendering, analysis generation and Discord/X delivery are unchanged. No migration or configuration change.

Controlling plan: [Watchlist public preview](watchlist-public-preview-and-images-plan.md).
