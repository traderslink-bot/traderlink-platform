# Course 3 Progress

Controlling plan: [Volume, Liquidity And Order Flow](academy-course-3-volume-liquidity-order-flow-plan.md)
Updated: 2026-10-08

## Required writing and QA standard

Apply the [general plan's writing and QA rules](academy-course-3-volume-liquidity-order-flow-plan.md#required-writing-and-qa-rules-for-every-lesson) from the first draft onward, and check them again before presenting each lesson for review:

1. Teach directly instead of using awkward review instructions.
2. Use concrete, ordinary language instead of abstract or system-like wording.
3. Explain unfamiliar terms before using them.
4. Make examples clear and check every calculation, assumption and table.

Read each complete lesson again after corrections. Record what was reviewed and any remaining issues here. These rules apply to all 14 lessons and later revisions. The owner delegated manuscript approval to Codex on 2026-10-08; visual design and integrated-course review remain separate checkpoints.

- [x] Inspect repository guidance and existing course content/registry/design sources.
- [x] Prepare complete 14-lesson writing and visual-design proposal.
- [x] Owner reviews and approves the plan — approved in chat on 2026-10-08.
- [x] Draft three representative editorial samples.
- [x] Owner approves three representative editorial samples — approved in chat on 2026-10-08.
- [x] Complete manuscript and source/arithmetic review.
- [x] Codex approves the complete manuscript under the owner's explicit delegation — 2026-10-08.
- [ ] Owner approves visual decisions and representative diagrams.
- [x] Prepare standalone visual preview using exact proposed production SVGs; desktop/phone rendered review complete — 2026-10-08.
- [ ] Integrate approved content, metadata, navigation and visuals.
- [ ] Owner accepts the integrated course.

## Editorial sample checkpoint

The owner approved the plan on 2026-10-08. The following review drafts are complete:

- [Stock Volume](../content/course-3-editorial-rewrites/volume.md): candle-aligned volume, comparable intervals, shared buyer/seller transactions, and a level test that holds versus fails.
- [Stock Liquidity](../content/course-3-editorial-rewrites/liquidity.md): distinguishes activity, volatility and liquidity; contrasts equal-volume stocks with different spreads/depth and explains size and session changes.
- [Level 2 And Market Depth](../content/course-3-editorial-rewrites/level-2.md): explains feed scope, displayed share units, multi-price fills and the limits of interpreting a shrinking book.

The owner approved the three corrected samples on 2026-10-08 and authorized drafting the remaining 11 lessons. All 14 are separate editorial manuscripts, not replacements for the Academy lesson files. Codex accepted the complete manuscript under the owner's later explicit delegation. Visual placement and asset decisions remain the later visual checkpoint; no existing diagram is being presented as approved for these manuscripts.

## Source and arithmetic review — 2026-10-08

- [Investor.gov: Types of Orders](https://www.investor.gov/introduction-investing/investing-basics/how-stock-markets-work/types-orders): verified market-price uncertainty and limit-price restrictions used in Stock Liquidity.
- [Investor.gov: Extended-Hours Trading](https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins/investor-bulletins-42): verified reduced trading interest/wider spreads through the official search result. Full-page read was not completed in this checkpoint.
- [Nasdaq TotalView whitepaper](https://www.nasdaq.com/solutions/data/equities/nasdaq-totalview/whitepaper): official search result confirmed displayed depth in the Nasdaq Market Center. The full-page request timed out; provider-specific implementation details have not been added.
- Manually checked illustrative arithmetic: 100 + 250 + 150 = 500 shares; 80,000 / 20,000 = 4.00x; quote spreads $20.02 − $20.00 = $0.02 and $20.20 − $20.00 = $0.20; frozen-book purchase 500 × $10.02 + 500 × $10.03 = $10,025.00. The average is described as a midpoint with a two-decimal rounded display, rather than substituting that rounded value for the actual execution prices.

## Owner-requested sample language QA — 2026-10-08

Completed an end-to-end editorial review and correction pass across all three sample lessons. The owner subsequently approved the corrected samples; the complete manuscript was later accepted under delegated editorial authority.

- Replaced the flagged “You can describe…” sentence with direct teaching about increased volume, candle closes and failed breakouts.
- Removed abstract review/audit language such as “establish,” “execution evidence,” “reconcile every order change,” “feed boundary,” and “accommodate this order size.”
- Defined order book, market depth, trading venue, tape and size units in plain language before using them in examples.
- Clarified volume-bar colors, daily session settings, current versus historical liquidity, and the limits of inferring trades from disappearing orders.
- Simplified the Level 2 example to 500 shares at $10.02 plus 500 at $10.04: total $10,030.00 and exact average $10.03. This supersedes the original rounded-average example recorded above.
- Reread all three revised lessons for flow, repeated caveats, undefined terms, example consistency and beginner clarity. Confirmed the proposed course titles, lesson slugs, order and navigation remain intact.
- Rechecked official Investor.gov and Nasdaq search results for extended-hours liquidity and market-depth coverage. Sources remain linked next to the relevant lesson claims.
- QA boundary: editorial drafts and manual arithmetic review only. No diagrams, browser rendering or published course reviewed in this pass. No tests or builds run, as instructed.

## Complete manuscript checkpoint — 2026-10-08

All 14 manuscripts and their review states are linked in the [complete manuscript review index](../content/course-3-editorial-rewrites/course-3-manuscript-review.md). The 11 remaining lessons were written under the approved writing rules, followed by an end-to-end reading of all 14 and a correction/reread pass. Codex accepted the manuscript under the owner's explicit delegation: “you will need to approve your own work.” The completed review supports textual acceptance; diagrams and rendered pages have not been accepted.

Diagram audit started: all 29 unique SVGs referenced by the existing 14 lessons exist locally and their XML/text labels were inspected. Some captions retain review-heavy language, including “RVOL scanner result needs chart review” and “Catalyst Reaction And Fade Review.” These need comparison with the approved writing standard. No visual quality or arithmetic acceptance is claimed from this source inventory; rendered inspection and exact keep/change/add decisions remain required.

New source checks:

- [TradingView RVOL screener calculation](https://www.tradingview.com/support/solutions/43000635874-how-do-we-calculate-relative-volume-and-relative-volume-at-time/): official result confirms different recent-bar and matching-time methods.
- [TradingView Relative Volume at Time](https://www.tradingview.com/support/solutions/43000705489-relative-volume-at-time/): page read confirms regular/cumulative comparison settings.
- [TradingView volume-profile concepts](https://www.tradingview.com/support/solutions/43000502040-volume-profile-indicators-basic-concepts/): official result confirms lower-timeframe calculation and up/down classification. This is cited as a provider example, not a universal profile algorithm.
- [Investor.gov order bulletin](https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins/investor-bulletins-14): page read confirms multi-price fills, limit restrictions, stop/stop-limit behavior and trigger variation, day expiry and IOC remainder cancellation.
- [Interactive Brokers Time and Sales](https://www.ibkrguides.com/traderworkstation/time-and-sales.htm): page read verifies configurable exchange and condition fields. No universal tape color scheme is claimed.

Arithmetic reviewed: relative-volume ratios 5.00x and 0.25x; five-period average 200,000 and resulting 1.50x; RVOL 3.00x and interval 0.80x; spike 6.00x; dollar volumes $500,000.00 and $20,000,000.00 (40 times), exact varying-price total $4,040.00 versus last-price estimate $4,080.00; spread crossing $4.00 and percentages 0.80%/0.08%; fill totals $10,030.00 and $4,012.00 with averages $10.03; favorable/unfavorable differences $20.00/$30.00; tape total 600 and report-count examples 2,000 versus 10,000; profile daily totals 100,000 each and combined rows 70,000/90,000/40,000; final RVOL 4.00x for both stocks, spread percentages 0.10% and approximately 3.85%, and $0.70 distance above the earlier level.

No unresolved editorial issue identified in this pass. Visual selection, diagram consistency, responsive layout, registry validation and browser behavior remain outside this text-only checkpoint. Help guides do not need changes for these draft-only edits.

Existing Academy lesson files, registries, progress data and UI remain unchanged. No tests, builds, server startup, commits or publication performed. The checkout contains substantial pre-existing staged and unstaged work; preserve it and use exact file/hunk allowlists for any later work. Manuscript review is not an accepted integrated feature slice.

## Standalone visual checkpoint — 2026-10-08

Fifth all-image artifact QA completed with no new defect. Revisited all 14 narrow-width renders, measured all 403 nonempty text labels for canvas overflow, checked palette contrast and rechecked worked arithmetic and exact hashes. No image changes required. [Fifth-pass record](../content/course-3-visual-preview/image-qa.md). Dense phone labels still need enlargement; integrated browser/device verification remains pending.

Fourth all-image QA completed with no new defect identified within the artifact review. Checked all 14 visible-label inventories, worked examples, current contact sheet, rectangle geometry and exact hashes. No image changes were necessary. [Fourth-pass record](../content/course-3-visual-preview/image-qa.md). Existing enlargement/integrated acceptance boundaries remain.

Third owner-requested image QA completed. Corrected two legend-placement problems in Relative Volume and Reading RVOL; retained all worked values. Reviewed all 14 source/rendered images, refreshed review renders and verified XML/hashes. [Third-pass evidence](../content/course-3-visual-preview/image-qa.md). No additional calculation/example mismatch identified; existing narrow-screen enlargement and integrated acceptance boundaries remain.

Second owner-requested all-image QA completed. Corrected profile bars obscuring candles, Dollar Volume's average-price wording, and RVOL time-label positions/zero scale/reference-line identification. Added a plain explanation of share-weighted average trade price to the Dollar Volume manuscript. All 14 images were revisited, re-rendered and hash/XML checked. [Second-pass record](../content/course-3-visual-preview/image-qa.md). No additional issue identified after corrections; narrow-screen enlargement and integrated browser/device acceptance remain required.

Owner-requested all-image QA is complete: [14-image findings and corrections](../content/course-3-visual-preview/image-qa.md). Corrected interval-specific RVOL averages, histogram alignment, candle/volume colors, unexplained order abbreviations and the first resistance-test wick. Reviewed all full-size and phone-width image renders, arithmetic, labels and hashes. Dense phone labels require enlargement; preview now includes full-size links, and image enlargement is recorded as an integration requirement. Source/artifact QA does not substitute for fresh browser or owner design acceptance.

Latest owner feedback: Stock Volume is substantially better; no blanket visual acceptance given. Clarified Relative Volume's two-stock comparison: each 500k label is the current daily volume of a different stock, with different historical averages. Replaced “Price · 1 day” with “Daily candles.” Added the requested wide micro-cap spread of bid $1.10 / ask $1.18 beside the narrower quote. The spread manuscript now works through the $0.08 gap, 7.27% of bid, and a 100-share round-trip loss of $8.00 before fees. Rendered and inspected both changed visuals; manifest refreshed. No live integration.

Third revision: owner requested actual platform-image research after rejecting the second attempt. Inspected TradingView's official RVOL screenshot and IBKR depth/tape screenshots, then redesigned all 14 files around chart panes and trading windows. [Reference evidence and complete inventory](../content/course-3-visual-preview/visual-references.md). Rendered all visuals, inspected them, corrected figure spacing/clipping and regenerated hashes. Browser tool blocks local `file:` navigation, so fresh HTML rendering verification is pending; rendered SVG inspection is complete. No owner visual acceptance claimed.

Owner rejected the first visual approach and requested recognizable trading displays, direct wording and self-contained explanations. Revised all 14 visuals: quote panels, order book, timestamped tape, fills, comparative volume bars and charts. Removed example labels, “snapshot,” placeholders, redundant bottom statements and duplicate captions. Removed external reading links from manuscripts while preserving the supporting sources here. Revised SVG hashes and preview are ready for further owner review; approval remains pending. The [visual review record](../content/course-3-visual-preview/visual-review.md) records both revisions.

The [visual preview](../content/course-3-visual-preview/index.html) and [visual review record](../content/course-3-visual-preview/visual-review.md) are ready for owner design review. Fourteen proposed production SVGs are loaded directly from `public/academy/images/volume-liquidity-order-flow/`; their exact paths and hashes are in the linked manifest. All 29 older visuals are preserved. Course 1 cross-listed placement decisions remain protected until integration review.

Completed text/arithmetic comparison, all-asset rendered inspection and standalone Edge desktop/390px phone checks. All 14 images loaded with no horizontal page overflow. Chart-label overlaps found during inspection were corrected and inspected again. No app tests/build/server or publication. Owner visual approval remains pending; live Academy integration has not started.

## Course page integration — 2026-10-08

Owner explicitly requested moving Course 3 to Available now, removing its Coming soon card and enabling its course page. Local implementation is complete: the launch-course registry now includes volume-liquidity-order-flow, which drives both Academy card sections and the shared course route. Course summary/audience/outcome are filled with teaching copy. The course route uses the same shared layout as Courses 1/2, with Course 3-specific sequence guidance.

Integrated all 14 accepted editorial manuscripts into their existing Academy lesson files, preserving lesson slugs and existing metadata. Each lesson uses its exact reviewed SVG beside the first teaching section. Course 3 membership titles and primary assets match those lessons. The two shared Course 1 lessons (Bid And Ask and Market Orders And Limit Orders) retain their existing slugs and course memberships; their shared lesson text now uses the revised manuscript.

Focused read-only source checks confirmed three available courses, six Course 3 modules, 14 present/loadable/launch-enabled lessons, unchanged hashes for all 14 preview SVGs and successful TSX parsing for the course page. No app server, build, tests, commit, push or publication. Integrated browser appearance remains unverified on this computer; source verification does not establish live deployment. Existing unrelated checkout changes were preserved. No Help Center change is needed for educational content/course navigation.

Local route: /academy/courses/volume-liquidity-order-flow/. Production still requires separately authorized publication.

## Complete-course follow-up QA — 2026-10-08

Post-correction consistency pass: no further change required. Verified all 14 contextual previous/next pairs, primary image references in registry/manuscripts, SVG XML and manifest hashes. Confirmed six populated modules in the correct progression, 14 unique required lessons and course-progress membership. Scope is local source/asset verification; deployed browser behavior remains unverified.

Navigation follow-up found the local Course 3 registry still used its older sequence: Spread before Bid And Ask and Slippage before Order Types. Corrected Course 3 display orders and contextual previous/next links to the approved plan/manuscripts. Spread now belongs to Quotes And Execution, matching the plan. Verified the complete 14-lesson sequence and both navigation directions; all lesson slugs and every other course membership remain unchanged. All in-body Academy lesson/image links resolve locally. No lesson or image rewrite was needed, and no runtime/publication verification is claimed.

Read all 14 current Academy lesson bodies and inspected all 14 diagrams in seven rendered pairs. Found one teaching/image mismatch: Relative Volume's text worked through morning totals while its image used completed daily bars. Added an explicit daily example matching Friday's 500,000 shares and the 100,000/2,000,000 daily averages, distinguishing it from the 10:00 a.m. table. Corrected both the Academy manuscript and review draft; refreshed the full preview. No diagram changes needed. No other material teaching, arithmetic or visible layout issue identified in this pass.

Verified all 14 Academy bodies match review drafts after excluding their image placements; all preview text, tables and lists present; all 14 SVGs parse and match their manifest hashes; lesson images exist; registry has 14 Course 3 placements across six modules. Independently recalculated 16 worked comparisons and totals. Rechecked current official Investor.gov order definitions, TradingView RVOL/profile documentation and Nasdaq TotalView coverage. Sources remain editorial references, not links replacing teaching inside the lessons.

Content and image QA accepted locally after the correction. Source QA does not establish deployed state or integrated browser/device behavior. No app server, build, test suite, Git operation or publication performed. No Help Center update required for this educational explanation.
