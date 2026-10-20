# Optional add-ons in plan cards

Owner requested an admin choice to keep the in-card optional add-on selector
available while defaulting it off. No deployment is authorized for this change.

## Implementation

- Each base plan's editor has “Show optional add-ons on this plan card” under
  Preview and publish, using the existing shared checkbox/theme controls.
- New plans start off. Older saved presentations without the property parse as
  off; legacy plans without a presentation also remain off.
- The existing versioned presentation JSON stores `showOptionalAddons`; drafts,
  publishing, reopening and public catalog reads use the same boolean contract.
  No SQL migration, enforcement, grant, pricing or checkout behavior changes.
- Display-only and purchasable plan cards both gate their selector on this flag.
  Existing private-offer restrictions still apply. The separate Add-ons section
  and standalone add-on purchase entry remain available.
- Saving keeps draft behavior; publishing exposes the chosen presentation.
  Current Stripe validation and private add-on secret pass-through are preserved.
- The administration Help guide now explains the default and how to enable it.

## Verification

Eight checks passed across the new setting integration tests and existing feature
section rendering tests. The new tests use the real writer, editor reader and
public catalog against disposable in-memory databases, checking older JSON,
default-off behavior, publish/reopen, opt-in/out, display-only and free enrollment
cards, private-offer exclusion and retained Add-ons section. Targeted lint passed.
The persistence test initially caught a missing editor-read projection; it was
fixed before the successful checkpoint.

Existing dashboard theme controls are reused without new color/style overrides.
There is no dashboard page structure change. Browser testing of this new setting
and current-base integrated build remain for the next coordinated review/release;
the previously staged pages do not yet include this local change.
