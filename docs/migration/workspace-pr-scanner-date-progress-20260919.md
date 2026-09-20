# Workspace PR Scanner posted date — September 19, 2026

Status: Display implementation complete; coordinator integration/release pending.

- Owner stopped the retention work, then requested only the posted date beside
  the time in the expanded Workspace scanner, with matching font.
- Enable the existing date option on pressReleaseEasternTime. Date and time stay
  in the same caption Typography, preserving font, weight, color and line layout.
- Both use article.publishedAt and America/New_York, as the existing time does.
- No retention, pagination, fetching, stream, compact-card or other News change.
- Source review and lightweight TSX syntax/patch-whitespace checks only; no tests,
  production build, browser run, database access or migration.
- Help review: this is a self-explanatory timestamp display; existing Press Release
  Push guides and their behavior do not change.
- Exact release base: 00e26b35d9faa5b4355838480fda73834415ed35. Shared stale checkout
  and index remain untouched. Coordinator owns integration and production status.
