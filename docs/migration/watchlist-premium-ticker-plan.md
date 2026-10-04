# Premium-only ticker

Owner approved reversible per-ticker restriction alongside the independent analysis toggle.
Progress: [implementation record](watchlist-premium-ticker-progress.md).

- Both toggles default Off after successful settings read. Persist changes and append actor/time/control audit; keep the other control unchanged. No AI requests, notifications or post deletion.
- Free list viewers get a blurred non-identifying placeholder, small orange **Premium members only**, and **Access Premium** linked to Whop. Do not send real symbol, company, flag, price or detail URL behind the blur.
- Premium and owner see normal list/detail. Restricted direct detail URLs show **This ticker is reserved for Premium members.**, sign-in and Access Premium, with no ticker content. Existing ticker URLs inherently identify the symbol and cannot be recalled.
- Gate detail JSON, analysis history, indicator endpoint and archive detail. Conceal archive listing identity. Apply the same projection to SSE and server-rendered/list JSON. Preserve unrelated publisher/admin routes and already published images.
- Turning Off restores access on refresh/polling; analysis restriction remains independent. Preserve restrictions on removal/re-addition.
- Coordinator reserved broader unapplied `0155_platform_watchlist_premium_access_controls`, order155, exact predecessor0154. This child supersedes analysis-only0155 in immutable24862449, which must not be released on its own.
- Source parent248624490af0236b71fb002874e7d25e9b3241c0. No push/deploy/migration application authorized. Focused checks only; prior integrated build/rendered acceptance remains outstanding.
