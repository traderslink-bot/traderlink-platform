# TradersLink Academy Visual Gap Audit: Academy Navigation Path Hubs

Date: 2026-05-17

Audit pass: Pass 4 - Visual Gap Audit

Group: Academy Navigation Path Hubs

Status: complete

## Scope

Reviewed the 4 Academy path hubs for visual support, navigation clarity, SVG health, and readiness for future Academy UI planning.

Path hubs reviewed:

- `academy/chart-reading-path.md`
- `academy/news-and-filings-path.md`
- `academy/trade-review-path.md`
- `academy/risk-discipline-path.md`

## Overall Verdict

Academy Navigation Path Hubs are visually strong enough for initial Academy UI planning.

Each hub has a dedicated path-map SVG that appears in the lesson body and is already manifest-tracked. The visuals help future UI work because they show the Academy as guided but not locked: users can follow a recommended path, resume learning, or move around freely.

No new path-map SVGs are required before UI planning. Future work should focus on UI states, not more static hub art.

## Coverage Summary

| Hub | Current Direct Visual Coverage | Result |
|---|---:|---|
| Chart Reading Path | 1 | Strong. |
| News And Filings Path | 1 | Strong. |
| Trade Review Path | 1 | Strong. |
| Risk Discipline Path | 1 | Strong. |

## Asset Verification

Direct scoped SVG references found in this group:

```text
4
```

Verification result:

- 4 of 4 path hubs include direct `visual_assets` metadata.
- 4 of 4 path hubs include in-body SVG placements.
- 4 of 4 unique scoped SVG references exist under `public/academy/images/chart-reading/`.
- 4 of 4 unique scoped SVG references are represented in `docs/content/learn-image-asset-manifest.md`.
- 4 of 4 unique scoped SVG files include embedded `title` tags.
- 4 of 4 unique scoped SVG files include embedded `desc` tags.
- No buy/sell labels, profit claims, guaranteed-outcome wording, or unsafe prediction framing were found in the scoped SVG labels.

Existing verified assets:

- `public/academy/images/chart-reading/academy-chart-reading-path-map.svg`
- `public/academy/images/chart-reading/academy-news-filings-path-map.svg`
- `public/academy/images/chart-reading/academy-trade-review-path-map.svg`
- `public/academy/images/chart-reading/academy-risk-discipline-path-map.svg`

## Future UI Visual States

These are future website/UI states rather than markdown SVG needs:

- Course-card progress states for each path hub.
- Resume-learning affordance showing the next unfinished lesson.
- Completed-lesson count by path.
- Recommended next lesson card that coexists with free navigation.
- Lightweight path filters for beginner, chart reading, news/filings, trade review, risk/discipline, and practice.

## Manifest Notes

No manifest rows were added or changed because no SVGs were created or edited in this pass.

## Result

Pass 4 is complete for Academy Navigation Path Hubs.

The path hubs are visually strong enough for initial Academy UI planning. Future work should move into UI-readiness review rather than more path-map asset creation.

