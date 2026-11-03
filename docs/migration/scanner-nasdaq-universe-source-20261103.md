# Scanner Nasdaq universe source — 2026-11-03

The live scanner universe now uses Nasdaq's stock-screener data endpoint as its
primary daily source. It requests the Nasdaq and NYSE listings directly from
the VPS, combines them by ticker, excludes invalid symbols and market caps, and
stores the complete validated set at or below $500 million. The scanner's
admin market-cap control remains the active display/qualification filter, so
collecting the wider set does not force every scanner to use a $500 million
ceiling.

The continuously running scanner worker starts the daily source attempt on its
first five-second cycle at or after 3:00 AM Eastern on an open market day. The
first successful refresh for each trading date is reused for the remainder of
that date. A failed source request does not replace or clear stored data: the
runtime keeps the most recent validated universe and retries the direct source
after 15 minutes. The existing authenticated upload route remains dormant for
now. No computer upload is part of normal operation or the active fallback
path; it should only be restored later if direct-source reliability warrants
it.

On 2026-11-03, a read-only live-source qualification returned 2,317 eligible
Nasdaq and NYSE listings at or below $500 million. BLZE was included with its
source market cap of approximately $458.06 million. Focused validation covered
source contracts, both exchanges, the cap boundary, storage/import behavior,
daily refresh reuse and universe alerts: 60 tests passed. Targeted lint and
Git whitespace validation also passed.

This change extends the universe architecture recorded in
[Private production screeners activation](./live-market-screeners-private-activation-20261102.md).
It is a source candidate only until the Coordinator performs the normal
combined release checks. The pending scanner UI changes remain undeployed.
