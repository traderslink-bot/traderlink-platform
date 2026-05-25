# TradersLink Auth

Last audited: 2026-05-25.

## Scope

Current website auth is Academy-oriented Discord login with a shared site nav auth display. The shared shell calls `/api/me` and shows either a Discord login link or the current Academy user display name.

## Routes

- Login: `GET /api/auth/discord/login`
- Callback: `GET /api/auth/discord/callback`
- Logout: `POST /api/auth/logout`
- Session status: `GET /api/me`

## Cookies

- Session cookie: `tl_academy_session`
- OAuth state cookie: `tl_academy_oauth_state`
- OAuth prompt cookie: `tl_academy_oauth_prompt`
- Session TTL: 30 days
- Production domain: `.traderslink.pro`, with host-only cleanup for legacy cookies
- SameSite: `Lax`
- HttpOnly: yes
- Secure: production only

## Discord OAuth

Scopes:

- `identify`
- `guilds`
- `guilds.members.read`

The login route first tries `prompt=none` unless the user explicitly requests consent. If Discord requires user interaction or consent, the callback retries once with `prompt=consent`. Repeated authorization prompts usually mean one of these is wrong:

- Session cookie is not being set or sent for the active domain.
- `DISCORD_REDIRECT_URI` does not exactly match the registered Discord callback and site origin.
- The user is not in the configured Discord guild.
- Production is missing `ACADEMY_DATABASE_URL` or `DATABASE_URL`, causing session creation to fail.
- Browser privacy settings or cross-domain redirects are blocking the cookie.

## Storage

Academy users, sessions, and completed lesson slugs are stored by `src/lib/academy/academy-progress-store.ts`.

Production must use `ACADEMY_DATABASE_URL` or `DATABASE_URL`. Local SQLite fallback is intentionally blocked in production.

## Academy Logged-In UX

`app/academy/page.tsx` hides the "Save your place as you learn" logged-out card when a valid Academy session exists, and also suppresses it immediately after `?auth=connected`.
