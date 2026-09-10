# Analyzed Trades pagination repair

- Source correction implemented; production and browser verification pending.
- Identified mount-time race: the unchanged empty ticker scheduled a reset after 250 ms. A response arriving sooner saved the next-page cursor, then the reset deleted it without triggering another fetch. Next consequently did nothing.
- Reset pagination only when the normalized ticker changes. Initialize the next-page cursor from supplied initial data and ignore aborted responses after JSON parsing.
- No table composition, calculations, trade identity, API, or database changes.
- Verification: focused ESLint and diff whitespace checks. No test suite, build, or live deployment. Browser confirmation still required; this source defect has not been reproduced in the owner's browser.
- Keep this narrow change separate from unrelated canonical-checkout edits and release only when the owner authorizes it.
