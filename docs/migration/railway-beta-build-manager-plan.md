# Railway Beta Build Manager Plan

**Status:** owner approved on 2026-08-21; active for the initial Railway beta build

**Progress:** [Railway Beta Build Manager Progress](railway-beta-build-manager-progress.md)

**Controlling release:** [Railway Free Discord Beta Launch Plan](railway-free-discord-beta-launch-plan.md)

## Purpose

Remove manual copying of Railway build errors during the initial beta launch.
The manager is the single deployment coordinator: it reads the newest Railway
failure, routes a Links AI Chat-specific compiler error to the separate Links
task when appropriate, and otherwise keeps the error in the launch task.

## Scope

1. Check only `traderlink-platform-web` in the Railway `production`
   environment every three minutes.
2. Read only the current deployment status and, for a new failed deployment,
   at most the latest 160 build-log lines for that deployment.
3. Record handled deployment IDs and repair-attempt counts in an ignored local
   state record, so an unchanged failure is forwarded once.
4. Route clear Links AI Chat/AI Review compiler errors to task
   `01a01e25-3e06-7762-a13d-10eb9e0c6c90` with the exact path, line and
   requirement.
5. Keep the launch task responsible for all other build errors, commit review
   and the push to `codex/traderlink-platform-replacement`.

## Boundaries

- The manager never calls `railway up`; a reviewed GitHub push triggers the
  connected Railway deployment.
- It never changes Railway variables, volume files, backups, DNS/domains,
  Vercel, `main`, production content, or the private database.
- It never resets, reverts, stages or commits another task's files.
- Links AI Chat makes only a narrow local commit and returns its hash; the
  launch task decides whether to push it.
- A second failed deployment for the same source commit is a stop condition.
  The manager records concise evidence and does not retry indefinitely.

## Acceptance

- A Railway failure is detected without owner copy/paste.
- The same failure is not forwarded more than once.
- A Links-specific error reaches the Links task automatically.
- No unattended infrastructure or destructive Git operation occurs.
- The active automation can be paused or removed after the beta build is
  healthy.
