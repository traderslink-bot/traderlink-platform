# TradersLink Academy Navigation Path Hubs Accuracy/Source Audit

Date: 2026-05-17

Audit pass: Pass 3 - Accuracy/Source Audit

Course group: Academy Navigation Path Hubs

Status: complete

## Files Reviewed

- `academy/chart-reading-path.md`
- `academy/news-and-filings-path.md`
- `academy/trade-review-path.md`
- `academy/risk-discipline-path.md`

Visual assets reviewed:

- `public/academy/images/chart-reading/academy-chart-reading-path-map.svg`
- `public/academy/images/chart-reading/academy-news-filings-path-map.svg`
- `public/academy/images/chart-reading/academy-trade-review-path-map.svg`
- `public/academy/images/chart-reading/academy-risk-discipline-path-map.svg`

Control and calibration files reviewed:

- `docs/content/traderslink-academy-quality-audit-navigation-path-hubs.md`
- `docs/content/traderslink-academy-sequence-cross-link-audit.md`
- `docs/content/traderslink-academy-quality-audit-workplan.md`
- `src/docs/2026-05-08-trader-intelligence-new-user-ux-qc-roadmap.md`

## Source References Used Internally

These references support the audit conclusions. They should remain internal audit notes and should not be exposed as citation blocks inside user-facing Academy lessons.

- SEC, `Day Trading: Your Dollars at Risk`, for risk, non-guarantee, and no-easy-profit framing.
- W3C WAI, WCAG Understanding SC 2.4.5 `Multiple Ways`, for the principle that users should be able to locate content in more than one way.
- W3C WAI, WCAG Understanding SC 3.2.3 `Consistent Navigation`, for consistent repeated navigation order and predictable page-to-page orientation.
- Local Trader Intelligence product calibration notes in `src/docs/2026-05-08-trader-intelligence-new-user-ux-qc-roadmap.md`, especially the guidance that Trader Intelligence should review trades after they happen and should not claim to predict winning trades or guarantee improvement.
- Local Academy sequence audit guidance in `docs/content/traderslink-academy-sequence-cross-link-audit.md`, especially the decision that the Academy should use course cards, lesson order, optional path hubs, cross-listed lessons, and continue-learning behavior rather than one strict locked chain.

## Overall Verdict

The Academy Navigation Path Hubs pass the accuracy/source audit after small cleanup edits.

The hubs are accurate as optional navigation support. They do not act like locked course requirements, do not replace the full lesson sequence, do not make investment recommendations, do not promise learning or trading outcomes, and do not overstate Trader Intelligence as a prediction or performance tool.

The strongest production-readiness point is that the hubs already give users multiple ways to move through the Academy: course order, path-hub routes, previous/next metadata, related lesson links, and future continue-learning support. That matches the intended Academy model and avoids turning the entire Academy into one long rigid chain.

## Accuracy Findings

| Area | Result | Notes |
|---|---|---|
| Optional path framing | Pass after minor wording edit | Chart Reading Path now says the order is "recommended" and "intentional," not the only correct order. |
| No locked-course implication | Pass | The hubs recommend order while allowing users to jump to specific lessons. |
| No investment advice | Pass | Educational disclaimers are present and the lessons do not tell users what to trade. |
| No buy/sell signals | Pass | No path hub or path-map SVG uses buy/sell labels or signal language. |
| No guarantee claims | Pass | The hubs repeatedly state that patterns, news, filings, risk concepts, and review do not guarantee outcomes. |
| Product truthfulness | Pass | Trader Intelligence language is framed around completed-trade review, behavior patterns, progress, and organization, not prediction. |
| Link accuracy | Pass | All in-body `/academy/.../` lesson links in the 4 hub markdown files resolve to local Academy markdown files. |
| Visual accuracy | Pass after minor SVG text cleanup | Existing path-map SVGs support the actual hub content, include title and desc tags, and use educational labels. |

## Edits Completed

Edited `academy/chart-reading-path.md`:

- Changed the learning-order sentence from absolute-sounding wording to recommended-order wording.

Edited `academy/trade-review-path.md`:

- Normalized curly quote characters in the example sentence to plain ASCII quotes.

Edited the 4 path-map SVGs:

- Replaced arrow glyphs in subtitle text with ASCII `->` so the labels render cleanly in environments that mishandle special characters.
- Confirmed the SVGs still include `title` and `desc` tags.
- Confirmed the SVG labels remain educational and do not introduce trade instructions, profit claims, or guaranteed-outcome language.

Updated `docs/content/learn-image-asset-manifest.md`:

- Refreshed the manifest notes for the 4 path-map SVGs to reflect the text normalization and this accuracy/source audit.

## Hub-Level Notes

| Hub | Accuracy Result | Source/UX Result | Product Bridge Result | Needed Follow-Up |
|---|---|---|---|---|
| `/academy/chart-reading-path/` | Pass | Recommended order is now clearly intentional without sounding locked. | Supporting bridge to review completed chart decisions. | None for Pass 3. |
| `/academy/news-and-filings-path/` | Pass | Strong source-first path; avoids claiming headlines or filings guarantee direction. | Core bridge to News/Filing Review and completed-trade review. | None for Pass 3. |
| `/academy/trade-review-path/` | Pass | Strong review path; normalized quote encoding. | Core bridge to Trade Review, Execution Review, Coaching, Analytics, and Progress/Academy. | None for Pass 3. |
| `/academy/risk-discipline-path/` | Pass | Risk/discipline framing is behavior-review focused, not shame-based or outcome-promising. | Core bridge to Risk Review, Coaching, Trade Review, and Analytics. | None for Pass 3. |

## Source-Sensitive Guardrails Confirmed

- Path hubs should remain optional guided routes, not locked prerequisites.
- Future UI may show completion and resume-learning states, but should not imply that finishing a hub guarantees trading improvement.
- Trader Intelligence references should stay in `Trader Intelligence Bridge`, `Apply This In Review`, future progress cards, or review-oriented UI surfaces.
- Do not add hard app route links inside path hubs until production app routes and product claims are stable.
- Keep source notes in internal audit files; do not add visible source/citation blocks to user-facing Academy lessons unless a specific lesson topic requires naming an official system or document.

## Verification Completed

- Confirmed all 4 path hubs include educational disclaimers.
- Confirmed all 4 path hubs use `/academy/...` public page links.
- Confirmed all in-body hub links resolve to local Academy markdown files.
- Confirmed no hard `/trader-intelligence/`, `/features/`, `/workspace/`, or other unstable app route links were added.
- Confirmed no visible source labels or citation sections were added to user-facing lessons.
- Confirmed no buy/sell, guaranteed-profit, guaranteed-outcome, or prediction claims were introduced.
- Confirmed the 4 path-map SVGs include `title` and `desc` tags.
- Confirmed no production website files, routes, React components, JSX, CSS, schemas, or Next.js pages were edited.

## Recommended Next Action

The course-by-course Pass 3 Accuracy/Source Audit cycle is complete.

Next recommended audit:

```text
Pass 4: Visual Gap Audit for Start Here For New Traders
```

Reason:

- Pass 1 lesson-level quality audits are complete.
- Pass 2 Academy-wide sequence and cross-link audit is complete.
- Pass 3 accuracy/source audits are complete across every current Academy course group and path-hub group.
- The next highest-value work is to begin the visual gap pass in course order, starting with the beginner onboarding path, so the future `/academy` UI can show realistic, useful visuals without rushing into production implementation.
