# Watchlist X posting

Owner approved implementation and now deployment plus secure reuse of the press-release app's Buffer credential and X channel. Separate X choice, same approved two analysis images, editable caption with X-aware 280-character counter. No public test post authorized.

## Complete scope

- Reuse Buffer account/channel but use a hosted Watchlist delivery path independent of the computer-run press-release app. Do not alter its text/news posting.
- Ticker-row `Post to X` opens caption/status controls. Before publication use `Also post to X` with editable caption; never post an unapproved analysis. Later sharing requires an explicit click for the displayed approved revision.
- Default caption: `$TICKER — TradersLink Analysis`, then `Where it could go next and pullback areas to watch.`, then `View the complete analysis, support/resistance levels and live indicators free on TradersLink. Link in bio.` Updated versions identify an update. No AI request for caption generation.
- Use twitter-text's official weighted count (URLs, Unicode, emojis). Show count/max, red when over; no silent truncation. Invalid X caption affects only X, never ordinary approval/Discord/push/email.
- Durable owner/cycle/revision intent and unique publication receipt. Freeze caption and approved PNGs. Do not substitute a newer revision. Preserve image order, split boundaries and watermark.
- Only explicitly selected approved images receive unguessable public PNG URLs for Buffer. No public directory/index or unpublished image access. Public share copies remain separate from private drafts.
- Server-only Buffer key/channel; validate connected X channel before create. Record accepted versus actually sent states. No automatic repeat of an ambiguous POST. Confirmed preparation failures allow retry; accepted Buffer posts are status-checked, not recreated.
- Pending approval intent expires if unfulfilled; removed/re-added ticker cannot inherit it. Automatic updates do not opt into X. Existing notification paths remain independent.
- Dedicated migration only after coordinator allocation; exact parent packaging to preserve dirty unrelated work. Help and progress updated. UI acceptance and focused offline tests before release; paid generation not needed. Live test is separate owner approval.

## QA checklist

280/281 ASCII, emoji families/skin tones, CJK, normalized accents, URLs; same counter server/UI; invalid caption ordinary approval; unpublished refusal; owner/CSRF access; revision change; reactivation isolation; repeated button/retry/restart; accepted-but-not-sent; timeout ambiguity; Buffer API errors; no secrets in errors; media signature/size/count/order; public token scope; mobile/iframe dialog; first/update captions; images match selected approved revision; no press-release regression.

Progress: [implementation record](watchlist-x-posting-progress.md).
