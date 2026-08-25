# Workspace First-Time Onboarding Progress

**Status:** Implemented — Railway release pending for the owner-approved Moomoo free-account guidance revision.

**Controlling plan:** [Workspace First-Time Onboarding Design Plan](workspace-first-time-onboarding-design-plan.md)

## Completed planning decisions

- [x] Preserve the normal Workspace dashboard and add a one-time guide rather
      than replacing it.
- [x] Explain executions, the richer Daily Trade Tracker workflow and the
      Trade Analyzer before the trader chooses a path.
- [x] Make Daily Trade Tracker the recommended first-entry path without
      presenting it as the only entry method.
- [x] Guide the Moomoo-first path through connection and then back to Daily
      Trade Tracker.
- [x] Keep Quick Trade Entry, Swing Trade Entry and Import statements as normal
      alternatives; state honestly that the Swing beta tool is still being built
      out.
- [x] Keep the first Daily Tracker handoff on the existing execution form.

## Completed beta-access decision

- [x] Desktop visual composition.
- [x] Narrow-mobile visual composition.
- [x] Exact Moomoo setup, success and unsuccessful-connection wording.
- [x] Every beta member has Trade Analyzer access. A connected Moomoo account
      supplies market data for chart-based reviews; it is not a paid gate.

## Approved Moomoo free-account revision

- [x] Keep the first Moomoo step simple: existing-account connection, free
      account creation, or Daily Trade Tracker without Moomoo.
- [x] Show free-account requirements only after the member selects **Create a
      free Moomoo account**.
- [x] Explain the known email path: website signup, stop at website brokerage
      setup, sign in through the Moomoo mobile app, choose **Do this later** in
      the app, then return to connect Moomoo in TradersLink.
- [x] State that Moomoo remains optional and Daily Trade Tracker keeps its
      normal benefits without Trade Analyzer.
- [x] Do not show a connection-success state until a verified Moomoo OAuth
      callback has saved an active connection.

## Implementation boundary

- [x] Read-only mapping of the existing Moomoo callback and Daily Tracker save
      path.
- [x] Confirmed the first-time completion fact: an accepted Journal execution,
      including a valid execution that leaves a position open.
- [x] Confirmed there is no close or dismissal option. The guide remains until
      the first accepted execution is saved.
- [x] Update the embedded Moomoo guide with the owner-approved free-account
      steps and separate existing-account connection action.
- [x] Restore the setup state when an authorization is incomplete and the
      member returns to Workspace; do not imply a connection succeeded.
- [x] Update Trade Analyzer Help Center Moomoo instructions to match the
      verified website-to-mobile-app setup path.
- [x] Add the Workspace guide without altering existing Workspace content.
- [x] Add the safe Moomoo-to-Daily-Tracker return handoff and tracker callout.
- [x] Keep Moomoo setup inside the guide, return a successful authorization
      directly to the Daily Tracker continuation, and resume a failed
      authorization at the embedded Moomoo step.
- [x] Keep the final Daily Tracker callout limited to form-specific guidance;
      it does not repeat the execution/trade lesson from Workspace.
- [x] Run focused ESLint and whitespace checks only; no broad test suite or
      local server process is included in this revision.
- [x] Owner approved the desktop and narrow-mobile composition from the
      lightweight static preview. The shared port 3010 was intentionally left
      untouched because it was serving a saved offline view.

## QA record

- [x] Existing accepted executions suppress the guide; a first accepted save
      suppresses the Tracker callout and the next Workspace visit.
- [x] The Moomoo route reads only the active saved connection fact. OAuth
      success goes to the Tracker continuation; failed, invalid or incomplete
      authorization returns to the embedded Workspace Moomoo step.
- [x] The Tracker continuation contains only form-specific guidance and hides
      the normal connection prompt while that guide is active.
- [x] Focused ESLint and whitespace checks pass after the revised free-account
      path is implemented.
- [ ] Canonical-main Railway deployment and health evidence recorded.
- [ ] Browser and external-Moomoo authorization QA remain intentionally
      pending; no local server was started and no external authorization was
      run.

## Release record

The guide was first recorded at local commit `c4eb3fc2`, then included in the
two-parent canonical-main reconciliation `941a9af3`. Follow-up `fa03f604`
corrected the external Moomoo link's component type. Railway deployment
`cb5e0554` is the verified live release.
