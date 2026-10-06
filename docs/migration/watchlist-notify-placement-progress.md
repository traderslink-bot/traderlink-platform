# Watchlist notification checkbox placement

Owner requested analysis notification checkbox directly below approval and distinct ticker-only wording. Narrow scope: main admin ticker row only. Existing choices, defaults and API payload remain unchanged.

- Group approval button and analysis notification checkbox vertically outside expandable publishing options.
- Analysis label: Notify users of the approved analysis.
- Ticker-only label: Notify published without analysis.
- Preserve private-category restrictions. Remove the incorrect already-listed requirement: first publications, removed/re-added tickers, and analyses added after ticker-only publication all show the notification checkbox when a draft is ready. Desktop/mobile wrapping and minimum touch heights retained.
- TS transpilation, embedded JavaScript parsing, exact labels and source placement checks pass. No broad tests, local server or live sends. Browser visual acceptance pending deployment.
- October 6 OLB/JAGX correction supersedes the earlier placement-only candidate d1351f6129bf7f7195f9605a30d45fcb9840d229. New package uses live parent d59756865440b34bc6e9bcd1ae56f5e5599ef0f6. The actual checkbox block is executed against listed/unlisted, public/private, checked/unchecked cases. Existing unchecked default and explicit owner selection are preserved. No automatic notification or publication triggered by the repair.
