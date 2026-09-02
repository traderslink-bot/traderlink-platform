# Workspace PR Scanner and Card Refinement Plan

## Purpose

Refine the Workspace Current Focuses, Rules broken, and PR Scanner cards;
make the PR Scanner card a user-selected Workspace option; and correct the
reported Tracker contrast and Demo-data presentation issues without changing
Journal facts or Demo executions.

Progress is tracked in
[workspace-pr-scanner-and-card-refinement-progress.md](./workspace-pr-scanner-and-card-refinement-progress.md).

## Owner-approved scope

1. **Workspace card hierarchy**
   - Increase the shared title size for the Current Focuses, Rules broken, and
     PR Scanner cards only.
   - Keep the Rules broken count beside its title, make it prominent, and add
     the requested breathing room above “Recent broken rules” and the list.
   - Keep rule names safely truncated within the fixed card width.

2. **PR Scanner**
   - Rename the compact card to “PR Scanner,” show up to six compact scanner
     headlines, and make ticker text more prominent with a distinct color.
   - Add a top-right `PR Scanner` action that opens the existing on-demand
     Workspace scanner panel.
   - In that panel, keep scanner articles opening the Workspace article drawer,
     add a visible `All news` route to the existing all-press-releases page,
     and let the user toggle whether the compact card appears in Workspace.
   - Store that toggle per user/workspace/account using the same optimistic
     revision boundary as the Rules broken card. The card remains lazy-loaded:
     its scanner fetch runs only when the user has enabled it.

3. **Rules preset labels**
   - Give the category and scope labels solid, distinguishable colors;
     Individual trade must not use an outlined blue treatment.

4. **Tracker contrast and Demo investigation**
   - Make the exact empty-Tracker helper line explicitly white in Navy Dark
     mode while preserving its Light-mode color.
   - Inspect the Demo scope and the Tracker/Workspace read paths. Do not alter
     Demo trade facts, analysis facts, dates, or projections without evidence
     of the production mismatch and a separate approved repair.

## Data and release boundaries

- The PR Scanner preference is presentation-only. It must not alter article
  reads, push preferences, scanner sources, or News retention.
- A schema migration may create only the small preference table; it is not run
  locally or in production during this feature work.
- Demo date remains fixed at 2026-08-21 for an active Demo account. A visible
  difference between Workspace and Tracker is treated as a read-path/projection
  defect to diagnose, not a reason to silently replace the Demo pack.

## Verification

- Run focused static checks only: migration manifest wiring, access scope,
  route mutation guard, card render condition, and `git diff --check`.
- Defer runtime/browser review and database migration execution to the owner
  and release gates.
