# Market Data request diagnostics and inventory repair

Owner request: investigate GCDT on September 8 and 9, explain connection/provider/pagination failures, exclude unrequested sessions, provide success/failure filters, and make desktop inventory compact with readable Dark-mode text.

## Evidence and scope

The production inventory before this repair showed GCDT September 8 with 480 saved candles and a latest attempt on September 9. Its two visible failures were dated August 8 and August 9; no September 9 session appeared. The owner confirmed September 8 and September 9 were intended. These observations do not establish why the intended request failed.

The owner provider path already continues empty pages when Moomoo supplies a valid continuation. It does not reject the first empty page. Sparse minutes are allowed. No speculative change to the normal Analyzer request algorithm is made.

## Implementation

- Record credential availability, request/response counts, HTTP status, numeric provider return code (including sign), returned row count, empty pages, accepted candle count and pagination completion for owner requests.
- Persist only safe numeric diagnostics in existing immutable operational events, linked to the immutable candle version by a hash. No migration or credentials in evidence. Older requests explicitly say detailed evidence was not recorded.
- Show each attempt's exact requested window and result code. Preserve successful saved candles after later failed requests.
- Require a recorded market-session version in the inventory; exclude unrequested queued session placeholders. Filter latest successful/failed attempts in SQL before pagination. Partial retrieval is failed even when some candles were saved.
- Use three desktop columns at medium widths and five at larger widths, with stacked mobile content. Explicit theme text color provides white text in Dark mode.

Normal Analyzer access to This Guy's shared Moomoo connection, correction submission, saved-candle reuse and usage accounting remain unchanged. The owner tool remains restricted to the two configured owner identities.

## Verification

Focused actual MUI/React client, chart and provider semantic type checking passed. This is not a full application type check. No Vitest, broad suite, local build or server was run. Exact-parent syntax/diff checks and release verification are recorded in the handoff.

Live GCDT September 8/9 requests and integrated rendered verification remain pending deployment. The cause of the reported request failure is not yet established. Coordinator owns Git publication and Railway only; owner feature instructions govern this repair. Direct production release is authorized; no staging or visual approval gate.

Help review: owner-only operational details are in the page. Ordinary Analyzer behavior and public Help instructions do not change.
