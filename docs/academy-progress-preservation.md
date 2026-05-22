# Academy Progress Preservation

Academy progress is user data. A normal website deploy must not reset it.

Progress is stored outside the Vercel build in the production database using
the `academy_lesson_completions` table. Each completion row is keyed by:

- `discord_user_id`
- `lesson_slug`

Because `lesson_slug` is part of the saved progress key, live lesson URLs must
be treated as stable once users can complete them.

## Deploy Rules

Before deploying Academy changes:

1. Run `npm run validate:academy-registry`.
2. Do not change `DATABASE_URL` or `ACADEMY_DATABASE_URL` unless intentionally
   migrating the progress database.
3. Do not delete, rename, or move a live lesson slug without adding a progress
   alias.
4. Do not reset, truncate, or recreate `academy_users`,
   `academy_sessions`, or `academy_lesson_completions` in production.

## Slug Rename Process

If a live lesson slug must change:

1. Add the new lesson slug to `academy/_data/progress-slug-baseline.json`.
2. Keep the old slug in `academy/_data/progress-slug-baseline.json`.
3. Add an alias in `academy/_data/progress-slug-aliases.json`:

```json
{
  "old_slug": "/academy/old-lesson-url/",
  "current_slug": "/academy/new-lesson-url/",
  "reason": "Renamed for clearer user-facing title."
}
```

The runtime expands saved completions so old rows still count toward the current
lesson. The registry validator fails if a protected live slug disappears without
an alias.

## What A Reset Usually Means

If progress appears to reset after a deploy, check these in order:

1. The user is still logged in with the same Discord account.
2. Production still points to the same Neon database.
3. The lesson slug was not changed without an alias.
4. The progress bar is looking at the intended lesson group.
5. `POST /api/academy/lessons/complete` is firing and returning `200`.

Deploying code by itself should not erase progress.
