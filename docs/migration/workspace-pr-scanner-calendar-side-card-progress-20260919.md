# Workspace PR Scanner and Calendar side cards — September 19, 2026

Status: Implementation artifact complete; owner visual review pending.

## Owner-approved scope

- Change only the expanded Workspace PR Scanner and Calendar presentations.
- Use the same right-side drawer/card structure as Workspace Rules and Notes for
  PR Scanner; use a shell-content card for desktop Calendar.
- Use full mobile width for both presentations.
- Make Calendar fill the shell's complete desktop main-content area while retaining
  the fixed shell header and the actual expanded or collapsed sidebar width.
- Use the established 1040px desktop maximum width for PR Scanner.
- Put the standard X close control in the top-right of both headers.
- Keep Workspace visible behind the side card instead of replacing its content.
- Preserve PR Scanner's released posted date, article drawer, visibility setting,
  article reads, access scope and existing bounded request.
- Preserve Calendar data, week/month navigation and Workspace presentation.
- Leave top buttons, Add trade, compact cards, other News pages and Calendar routes unchanged.

## Review boundary

- Exact production parent: `5e520346b7a89182a636c6650fde98e9dea7cb73`.
- Runtime allowlist: Workspace dashboard, PR Scanner panel and Calendar panel.
- Documentation allowlist: controlling scanner plan and this progress record.
- No schema, migration, server, API, database, retention, pagination, stream,
  ingestion, notification or other route changes.
- Help review: existing Help has no Workspace scanner/calendar panel instructions;
  no guide correction is required for this presentation-only change.
- Static checks may run after artifact integration. Automated tests, production
  build and release remain deferred under the owner UI-review gate.
- Production publication remains with the Visible release coordinator after
  owner visual approval.
