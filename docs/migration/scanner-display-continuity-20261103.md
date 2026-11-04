# Scanner display continuity — 2026-11-03 ET

The member and Admin scanner client retains the last populated read model when
a successful five-second poll unexpectedly returns every scanner list empty.
It waits through a continuous 30-second empty interval and replaces the display
immediately when populated data resumes.

The hold does not cross a trading date, a named session change, disabled state,
closed hours or a missing-universe state. Transport failures already retained
the prior model and continue to use the existing availability notice. This is
display continuity only: it does not alter scanner qualification, audits,
provider requests or stored data.

Focused verification covers the exact 30-second boundary, expiry, immediate
recovery, terminal states, market-context changes and the actual five-second
React polling path. The Scanner Help guides were reviewed. They do not describe
poll-level rendering continuity, so no member-facing guide correction is needed.
