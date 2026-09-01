# Dark Appearance Preference Plan

**Status:** Owner-approved implementation in progress

**Visual authority:** `workspace-dark-palettes.html` from the owner-approved
2026-08-30 Workspace review artifact. The selected variant is **Navy**; the
Charcoal and Ink samples are not implementation options.

## Outcome

Authenticated TradersLink Platform dashboard users can select either Light or
Dark in Account Settings. Light remains byte-for-byte equivalent in intent to
the accepted Material appearance. Dark uses the approved Navy palette through
the shared Material theme rather than page-specific dark CSS.

## Approved Navy token mapping

| Meaning | Token | Value |
| --- | --- | --- |
| Dashboard canvas | `background.default` | `#0e1520` |
| Card and panel | `background.paper` | `#151f2d` |
| App bar | `traderLink.appBar` | `#121d2b` |
| Navigation drawer | `traderLink.navigation` | `#121a26` |
| Border and divider | `divider` | `#314158` |
| Primary text | `text.primary` | `#ffffff` |
| Secondary text | `text.secondary` | `#ffffff` |
| Disabled text | `text.disabled` | `#707d90` |
| Selected navigation | `action.selected` | `#24344a` |
| Primary action | `primary.main` | `#285a9f` |
| Link and focus accent | `primary.light` | `#79aaf1` |
| Gain / success | `success.main` | `#56d487` |
| Loss / error | `error.main` | `#ff7373` |
| Warning | `warning.main` | `#ffc76b` |

## Composition and data boundary

1. The request-authorized dashboard frame reads the active user preference
   without caching it across users, then mounts the shared Material provider
   with that initial mode. This gives the first authenticated response the
   selected palette and prevents a light-to-dark navigation or refresh flash.
2. The preference is stored in the existing `platform_user_preferences` row.
   Reads and writes require a canonical active user plus active membership in
   the request workspace. The browser sends only `light` or `dark`; it never
   supplies a user or workspace identity.
3. Dashboard shell, cards, controls, drawers, dialogs, tables and Material
   component overrides consume shared palette tokens. The shell gets its app
   bar and navigation tokens from the same theme. The persistent desktop
   sidebar and mobile navigation drawer each include the same compact 44px
   hit-area sun/moon two-state toggle with a 44px by 22px visible track directly
   above the existing Install TradersLink app action.
   It visibly indicates the active mode, calls the authorized preference action
   already used by Account Settings, and keeps that Appearance control available.
4. The existing opaque, partitioned PWA device state carries the resolved mode
   for the currently authorized offline partition. It is not a global browser
   preference and is removed with that partition.
5. The Monthly P/L SVG and Daily Trade Analyzer chart receive the corresponding
   theme tokens. Chart gain/loss colors remain semantically green/red.

## Non-goals and safety constraints

- No system/default appearance option, global browser preference, hosted
  configuration, Railway action, applied migration, or Journal fact change.
- No page-local dark-mode stylesheet where a shared Material token can express
  the approved result.
- No local server, full build, Vitest, broad test suite, dependency install,
  push, deployment, or release claim in this source-only task. Browser
  verification occurs only against a Coordinator-deployed isolated staging
  candidate.

## Acceptance record

Track implementation and review state in
[Dark Appearance Preference Progress](dark-appearance-preference-progress.md).
