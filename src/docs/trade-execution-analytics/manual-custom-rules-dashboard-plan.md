# Manual Custom Rules Dashboard Plan

## Purpose

Add a clear manual-rule path to `/rules` for commitments a trader wants to
write in their own words but that cannot honestly be checked from execution
data alone.

## Phase Scope

- Create a custom rule with a short name, rule statement, category, and future
  review scope.
- Persist custom rules locally under the same owner/workspace boundary as preset
  rules.
- Support prospective revisions and pause, resume, and retirement lifecycle
  controls.
- Show custom rules beside automatic preset rules while making their status
  unmistakable: they are manual commitments, not automatic trade-data checks.

## Deliberately Deferred

- Day Session, ticker-day, and trade-detail check-ins.
- Followed/broke/not-applicable/not-sure responses.
- Rule-linked P/L, adherence percentages, and Rule Analytics.
- Natural-language compilation, AI suggestions, AI scoring, or any automatic
  interpretation of a custom rule.

## Product Contract

- The trader owns the sentence and can revise it, but edits produce a new
  version rather than rewriting prior history.
- A custom rule must never be presented as automatically evaluated.
- The future review scope only prepares the rule for later optional check-ins;
  it does not add a required workflow today.
- Automatic presets remain separate, typed, deterministic contracts backed by
  governed v3 execution analytics.

## Acceptance Criteria

- A custom rule survives a local dashboard restart.
- The owner can create, edit, pause, resume, and retire it.
- The Rules page makes the manual versus automatic distinction immediately
  clear.
- No client component receives owner identifiers or calculates financial,
  adherence, or evaluation results.
