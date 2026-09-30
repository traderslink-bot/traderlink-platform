# Watchlist X direct-link cadence

Owner request: every second Watchlist X post includes https://app.traderslink.pro/watchlist. Press-release posts use a separate every-third rule owned by the PR flow. Discord remains unchanged.

Implementation: count saved sent Watchlist X records for the same channel, including existing successful history. Odd completed count selects the linked caption for the next new post. Replace the default trailing Link in bio sentence with the URL. Preserve custom wording; reject an overlength X caption rather than silently truncating it. Save caption atomically with the sending claim; retries reuse that saved caption. Failed attempts do not increment sent counts. Pending Buffer acceptance is resolved before selecting the next new-post variant. No schema, migration, configuration or image changes.

Retry boundary: if a failed post is retried after other posts have succeeded, it retains its original linked/unlinked variant. Such out-of-order retries can interrupt strict alternation; no failed post blocks all later posting.

Verification: seven-post offline worker/SQLite simulation passed alternating captions, no success increment on rejection, frozen retry caption, pending acceptance ordering, existing URL deduplication and weighted character-limit validation. No live posts. Deployment pending.
