# Dark Appearance Preference Progress

**Status:** Source implementation and focused QA repairs complete through the current local child repair; owner browser review pending

**Controlling plan:** [Dark Appearance Preference Plan](dark-appearance-preference-plan.md)

## Approved visual decision

- [x] Located the owner-approved 2026-08-30 review artifact.
- [x] Confirmed Navy is the selected dark variant; Charcoal and Ink are not in scope.
- [x] Recorded the exact approved token mapping before implementation.

## Implementation checklist

- [x] Add a strictly validated Light/Dark preference to the existing user preference record and source migration manifest.
- [x] Read that preference through the authorized dashboard frame and apply it through the shared Material provider.
- [x] Add the Appearance control to Account Settings.
- [x] Apply approved tokens to shared components, dashboard shell, charts and scoped PWA/offline state.
- [x] Repair the focused source QA findings without changing Light behavior: chart containers and analytic SVGs, Daily Trade Analyzer floating controls, AI Chat support surfaces, and Community Watchlist cards now use the Navy token branch in Dark mode.
- [x] Repair the follow-up source QA findings without changing Light behavior: restore the exact Light ticker-input border and radius, theme the Newsletter cards and sticky table-header surface in Dark mode, and correct this checkpoint record.
- [x] Renumber the unapplied appearance migration from `0100` to `0103` to avoid the staging lineage's already-reserved `0100` through `0102` IDs; its SQL and behavior remain unchanged.
- [x] Complete the permitted static and whitespace review: `git diff --check` passes. Type and lint commands are unavailable because this source-only worktree has no `node_modules`; no dependency install was authorized.
- [x] Send Coordinator the parent, detached-main baseline, allowlist, collision points and proof before the narrow local checkpoint.
- [x] Repair the cumulative QA findings while preserving exact Light branches: AI Chat assistant messages; Daily Trade Analyzer canvas annotation fills, outline and selection shadow; Day and Swing Tracker secondary surfaces; Calendar selection, gain/loss, neutral and blank-month surfaces; scroll/help/shell interaction surfaces; and the active Broker, Moomoo, Trade Analysis, Press Release and Account AI-delivery panels.
- [x] Add the permanent dashboard Light/Dark implementation rule to `AGENTS.md`, including explicit SVG/canvas/chart/third-party and state coverage requirements.
- [x] Preserve the reviewed local repair lineage on the detached local-main snapshot: `444a61d490ca4e2452f1fe9abdd5960a17c5b6ea` -> `802f1021e6729b7c211ca107dff4401686b7c807` -> `32f92f20345e875586611fdcda057cc4e2f15d52` -> `c28d093005411db43b2dfbaa52237fc91e35ca71` -> `a2b16e9340fd05869ca7ad83c58cd5a1e8454053` -> `c2855c6f737df69be04fa28da91dd97bd7452e39`. It has not been pushed, merged, deployed or applied.
- [x] Repair the independent static-QA follow-up on parent `c2855c6f737df69be04fa28da91dd97bd7452e39`: Dark chart indicator/volume/execution/rule colors and matching legends; remaining Day Analyzer information and warning states; active Daily Tracker Help and Help collection surfaces; and both AI Review document headers/semantic panels. The corresponding local child SHA is reported in the Coordinator and QA handoff because a Git commit cannot self-record its final object SHA in its own contents. It has not been pushed, merged, deployed or applied.
- [x] Repair the final static-QA P1 findings on parent `df7c596696cca42598a19113a8d621aa18a1a615`: the Swing Tracker status panel now branches to the approved Dark warning alpha surface, and the Daily Analyzer uses one contrast-safe Dark pattern palette for canvas indicators and both legend layouts while retaining every Light pattern literal. The corresponding local child SHA is reported in the Coordinator and QA handoff because a Git commit cannot self-record its final object SHA in its own contents. It has not been pushed, merged, deployed or applied.
- [x] Repair the final static-QA P2 findings on parent `01943e62054ffb673e5fa890cfd200fb2c55ab42`: generic Help callouts now use Dark warning/info token-alpha surfaces and borders, and expanded navigation groups use the shared Dark divider while preserving `#d4dae3` in Light. The corresponding local child SHA is reported in the Coordinator and QA handoff because a Git commit cannot self-record its final object SHA in its own contents. It has not been pushed, merged, deployed or applied.
- [x] Correct the owner-reported Dark text contrast at the shared source: the Dark primary and secondary text tokens and table-header override are white; the shared Account Settings and Daily Trade Tracker eyebrow preserve their approved Light primary color while resolving to white in Dark; and the desktop navigation uses the same logo asset as Light with no blue background.
- [x] Add the owner-approved bottom-navigation appearance switch: desktop sidebar and mobile navigation drawer use the normal MUI Switch directly above the existing Install TradersLink app action. Its visible `Light mode` or `Dark mode` label states the current result; there are no icon glyphs or custom track/thumb travel geometry. It reuses the authorized Account Preferences action and retains its accessible action name, pending behavior, and immediate save/revert behavior while Account Preferences remains available. The scoped Workspace trade-library foreground plus shared Dark text/header tokens cover its grid labels and rows without changing Light or white action icons.

## Guardrails

- The task is source-only. No migration is applied and no local database,
  Railway configuration, hosted state or Journal trade fact is changed.
- Appearance is not cached or stored across authenticated users. Offline device
  state stays behind the existing opaque partition key.
- Owner browser review remains a separate acceptance step; no server is started
  from this worktree.
- The remaining acceptance evidence is visual: verify Dark and Light on desktop
  and mobile, including third-party chart rendering and the preserved semantic
  annotation colors. This record does not claim a release, deployment or
  browser acceptance.

## Corrective isolated-staging visual gate

- [x] Preserve the owner-rejected staging evidence without operating it: source
  `62915b227b748b8b0c17a949e0ec0f0ea892bfc6`, parent
  `825d4e517b8069e2fd84102ae4129fc6b4c2b87d`, successful Railway deployment
  `b0873433-7164-4790-a540-f808e7adb1d9`, and ready single-node health state.
- [ ] After the Coordinator deploys this corrective candidate to isolated
  staging, capture actual Light and Dark desktop/mobile evidence for `/workspace`
  (top area plus grid headers and rows), `/account/trading`,
  `/account/preferences`, `/account/ai`, `/account/profile`,
  `/account/security`, `/account/privacy`, `/trade-tracker`, `/ai-chat`,
  `/ai-reviews`, and representative dashboard pages `/calendar` and `/analytics`,
  plus `/rules` with its Preset Library heading and explanatory paragraph.
  Confirm the compact navigation toggle persists the selected mode, remains
  keyboard-focusable and leaves Account Preferences available. Do not mark this
  gate complete from source inspection alone.
- [x] The selected-icon and custom compact-track revisions were superseded by
  the owner-requested default MUI Switch after staging review. The replacement
  has a visible current-mode label, no icons, no custom travel geometry, and
  retains the authorized preference action and direct save/revert behavior.
- [x] Replace the legacy unavailable-state surface on disabled AI routes with
  the shared plain Coming soon message. `/account/ai`, `/ai-chat`, and
  `/ai-reviews` now use the same serializable `text.primary` presentation in
  Dark mode while retaining their normal Light text; unrelated unavailable
  states remain unchanged.
- [x] Repair the isolated-staging server/client render boundary: the shared
  unavailable state and AI coming-soon page now use serializable palette-token
  props rather than theme callbacks in Material `sx` objects. The repair covers
  `/account/ai`, `/ai-chat`, and `/ai-reviews` without changing their approved
  Light colors; fresh source QA and isolated-staging verification remain
  required.
- [x] Keep `/ai-chat` as the canonical AI route. The owner did not authorize a
  new `/ai` alias, so no route or redirect is added for that unowned path.
- [x] Replace the opaque Dark navigation logo candidate with the owner-approved
  transparent `logo-horizontal-dark.png`, mechanically derived from the
  official Light geometry. Desktop and mobile navigation select it only in
  Dark mode; Light retains the accepted official blue wordmark asset.
- [x] Enforce the Dark-only white foreground for every shared
  `Typography color="text.secondary"` surface. This includes the top-left
  introductory text beneath dashboard page titles (such as Rule Results) while
  preserving the existing Light-mode secondary-text hierarchy and all page
  behavior and copy.
- [x] Apply the deployed Dark-mode correction to the two Rules route-specific
  introductions: the `/rules` explanatory block and `/rules/results` facts
  sentence now inherit `text.primary` only in Dark mode. Their Light-mode
  foregrounds, copy and Rules behavior remain unchanged.
- [x] Keep the disabled `/account/ai` Coming soon block as a client theme-token
  leaf, so its exact title and free-beta message resolve to the active
  `text.primary` foreground in both appearances. This preserves the approved
  Light output while making the isolated-staging Dark foreground white without
  changing the accepted toggle, logo or Rules surfaces.
- [x] Correct only the owner-reported production Dark text surfaces: the
  title-adjacent descriptions on Trade Explorer, Compare trades and Daily Trade
  Tracker now use one client leaf that preserves Light `text.secondary` and
  resolves to white in Dark. The `/analytics/trade-analyzer/day/trades` empty
  state `No saved trade analyses are available.` receives the same narrow
  Dark-only foreground; adjacent filter-empty, semantic and status text remain
  unchanged.
