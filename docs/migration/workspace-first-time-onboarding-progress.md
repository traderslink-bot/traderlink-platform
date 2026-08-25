# Workspace First-Time Onboarding Progress

**Status:** Complete guide implementation finished; release integration pending.

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

## Implementation boundary

- [x] Read-only mapping of the existing Moomoo callback and Daily Tracker save
      path.
- [x] Confirmed the first-time completion fact: an accepted Journal execution,
      including a valid execution that leaves a position open.
- [x] Confirmed there is no close or dismissal option. The guide remains until
      the first accepted execution is saved.
- [x] Confirmed that Moomoo authorization is an embedded guide branch: success
      resumes Daily Tracker guidance and failure resumes the Workspace Moomoo
      step.
- [x] Add the Workspace guide without altering existing Workspace content.
- [x] Add the safe Moomoo-to-Daily-Tracker return handoff and tracker callout.
- [x] Keep Moomoo setup inside the guide, return a successful authorization
      directly to the Daily Tracker continuation, and resume a failed
      authorization at the embedded Moomoo step.
- [x] Keep the final Daily Tracker callout limited to form-specific guidance;
      it does not repeat the execution/trade lesson from Workspace.
- [x] Run focused ESLint and whitespace checks only; no broad test suite,
      process, deployment, commit or release action is included in this slice.
- [x] Owner approved the desktop and narrow-mobile composition from the
      lightweight static preview. The shared port 3010 was intentionally left
      untouched because it was serving a saved offline view.

## QA record

- [x] Existing accepted executions suppress the guide; a first accepted save
      suppresses the Tracker callout and the next Workspace visit.
- [x] The Moomoo route reads only the active saved connection fact. OAuth
      success goes to the Tracker continuation; failed or invalid authorization
      returns to the embedded Workspace Moomoo step.
- [x] The Tracker continuation contains only form-specific guidance and hides
      the normal connection prompt while that guide is active.
- [x] Focused ESLint and whitespace checks pass after removing the obsolete
      Workspace success-return branch.
- [ ] Browser and deployed-flow QA remain pending a clean release integration;
      no local server was started and no external Moomoo authorization was run.

## Release boundary

The current checkout is a shared, mixed worktree on
`codex/traderlink-platform-replacement`, while `origin/main` has a different
parent. Do not commit or deploy this slice from the current state. The release
owner must first provide a clean, integrated source-branch slot; then this
slice can be committed with an explicit file allowlist and deployed for the
live review.
