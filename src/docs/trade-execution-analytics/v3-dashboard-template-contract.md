# Trader Intelligence v3 dashboard template contract

## Purpose

The approved Trader Intelligence design baseline is the light Material
dashboard at `/workspace`. The reusable v3 template makes that design the
default for every dashboard page and prevents individual routes from creating
slightly different headers, sidebars, spacing, cards, or action buttons.

This is a code-enforced contract, not only a visual reference.

## Sources of truth

| Concern | Source of truth |
| --- | --- |
| Shared route layout | `app/(dashboard)/layout.tsx` |
| Public template exports | `app/dashboard-template.tsx` |
| Header, logo, sidebar, responsive behavior, page `<main>` | `app/dashboard-shell.tsx` |
| Navigation groups, destinations, icon keys, route titles | `app/dashboard-navigation.ts` |
| Material theme and button styling | `app/mui-theme.ts` |
| Canonical page, card, status, and action components | `app/dashboard-ui.tsx`, re-exported only through `app/dashboard-template.tsx` |
| Architectural enforcement | `src/lib/trader-intelligence-v3/__tests__/dashboard-template-enforcement.test.ts` |

## Required page structure

All dashboard pages belong under `app/(dashboard)`. The route group's layout
automatically renders the shared template, owner guard, private/no-store
policy, header, navigation, and full-width page container.

A page or page-level client component should render its content inside
`DashboardPage`:

~~~tsx
import {
  DashboardPage,
  DashboardPanel,
  DashboardPrimaryAction,
  DashboardSecondaryAction,
} from "../../dashboard-template";

export function ExampleDashboardPage() {
  return (
    <DashboardPage>
      <DashboardPanel title="Example">
        {/* Page content */}
        <DashboardPrimaryAction>Save changes</DashboardPrimaryAction>
        <DashboardSecondaryAction>Cancel</DashboardSecondaryAction>
      </DashboardPanel>
    </DashboardPage>
  );
}
~~~

Pages must not import or recreate `AppBar`, `Toolbar`, `Drawer`,
`DashboardShell`, the TradersLink logo, or a local `<main>` page container.
They also must not duplicate navigation arrays or route-title maps.

## Navigation

Add or change navigation in `app/dashboard-navigation.ts`. Every configured
internal destination must have a corresponding `page.tsx` beneath
`app/(dashboard)`. Icons are declared as stable semantic keys and resolved by
the shell, keeping the configuration independent from Material icon
components.

## Cards and actions

Use `DashboardMetricCard` for compact key metrics and `DashboardPanel` for
normal dashboard sections. Extend those shared components when a repeated
visual need appears; do not create a page-only imitation.

Primary actions use:

- `#011E56` background
- white text
- 8px corner radius
- 40px minimum height
- bold sentence-case labels
- no elevation or shadow, including hover and active states

Secondary actions are outlined in the same navy with a quiet navy hover tint.
They must not use a competing filled color. Existing Material `contained`,
`outlined`, and `text` primary buttons inherit the same theme-level hierarchy;
the named dashboard action components make intent explicit for new work.

## Enforcement

Run:

~~~text
npm run verify:ti-v3:dashboard-template
~~~

The verification fails when:

- the route-group layout stops rendering `V3DashboardTemplate`;
- a configured navigation destination has no dashboard page;
- a dashboard page attempts to create its own shell, header, sidebar, logo, or
  `<main>` container;
- a canonical dashboard surface bypasses the template exports;
- the shell duplicates navigation configuration; or
- the shared primary-action tokens drift from the approved design.

`AGENTS.md` tells every Codex task in this checkout to follow this contract.
The shared layout makes compliance automatic at runtime, and the verification
script is the merge/CI guard. Other worktrees and chats receive the rule only
after they include the commit containing these files.
