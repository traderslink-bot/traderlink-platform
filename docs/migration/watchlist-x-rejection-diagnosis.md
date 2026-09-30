# X delivery rejection diagnosis

Production SOAR and BKYI attempts froze two images and passed channel validation, but Buffer returned a MutationError before issuing a post ID. Previous code discarded its message. Specific provider cause is therefore not recoverable from saved rows. This is not proof of user error, rate limiting, or a media defect.

Diagnostic correction: retain a bounded, sanitized provider rejection in the existing owner-only status. Remove credentials, destination IDs, URLs, long tokens, and control characters. Preserve uncertain-send handling and all existing retry/publication rules. No posts, retries, configuration changes, or migrations performed.

Focused offline verification: `node src/scripts/verify-watchlist-x-rejection.cjs`. Does not contact Buffer. Help reviewed: existing status/retry flow is unchanged, so no new user workflow documentation is required.

This slice is diagnostic only, not a claim that X delivery is fixed. Coordinator owns release. A separately authorized controlled attempt or provider-side evidence is needed to capture the actual rejection and complete the repair. Never automatically retry the failed publications.
