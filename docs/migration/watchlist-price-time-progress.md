# Watchlist price time and live status

Owner-approved scope: actual price-observation time below prices when live data is Off; no delayed-15-second label in that state; green On/red Off borders and state text; remove detail hero price and generic update time. Preserve analysis publication history, providers, notifications and unrelated work.

Implementation: `watchlist-price-status.tsx` formats only ticker-source `latestPriceObservedAt`, never record `updatedAt`. Missing provenance displays Price time unavailable rather than inventing a timestamp. Listing price-time column also uses the quote field. Potential Path receives the same note. Global statuses other than live display Off without changing backend status semantics.

Progress: source implemented; both local TSX syntax checks and focused price-note checks pass (Friday quote versus Sunday record update, all four Off states, live delay label, missing timestamp and card-derived provenance). Not a full build or hosted visual acceptance. Not deployed. No live provider or notification calls. Actual GYGY/APUS provider timestamps remain unverified; the confirmed presentation defect was displaying record update time. No claim that old missing or incorrect provider timestamps have been repaired.

Release: mixed checkout; only use the narrow patch and new helper, never copy the entire client. The patch is generated against immutable 4770e0e4 and preserves General Watchlist/reverse-split/trader-notes code, passes marketDataStatus to every table, and adds latestPriceSource to lightweight listing projection. Hosted visual acceptance and a fresh quote-versus-record timestamp comparison remain required. The overnight record has checkedAt only; its old Checked line is replaced with Not live / Price time unavailable rather than falsely calling lookup time the price time. Original overnight price and premarket-resumption note remain intact. No schema or runtime changes.

Help addition: When Live data is Off, the price note shows the last available price time in Eastern Time, not the post or page update time. The delayed-price label is hidden. Green On and red Off describe the live-data feed.
