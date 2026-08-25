# Workspace First-Time Onboarding Design Plan

**Status:** Complete — deployed from canonical `main` on 2026-08-25.

**Route:** `/workspace`, with a handoff to `/trade-tracker` and the existing Moomoo connection experience.

**Progress:** [Workspace First-Time Onboarding Progress](workspace-first-time-onboarding-progress.md)

**Controlling plan:** [Migration Progress](migration-progress.md)

## 1. Outcome

Give a genuinely new trader a short, non-blocking guide to the richest normal
TraderLink workflow without replacing the Workspace dashboard or creating a
second trade-entry form.

The guide teaches how executions become trades, explains why the Daily Trade
Tracker is the recommended learning and review path, explains what Trade
Analyzer adds, and lets the trader either connect Moomoo before entry or go
straight to the existing Daily Trade Tracker.

## 2. Fixed owner decisions

- The normal Workspace stays intact. Its Welcome message, performance cards,
  calendar, PWA install card, Current Focuses, Focus Rules, previous trading-day
  review and regular Add Trades choices remain in their current places.
- The guide appears only for a first-time trader. It is not a permanent
  Workspace section, a modal, a new dashboard, or a separate trade-entry flow.
- TradersLink has several ways to enter trades. Daily Trade Tracker is the
  recommended path because it combines execution entry with notes, tags,
  trading rules, review context and the later Trade Analyzer experience.
- Quick Trade Entry, Swing Trade Entry and Import statements remain available
  as normal alternatives. They must not be represented as unavailable or
  inferior data sources.
- Swing Trade Entry remains available for intentional swing positions. Its
  normal entry surface must plainly say that the beta tool is still being built
  out.
- Trade Analyzer is described before the trader chooses a path. It is not
  introduced as an afterthought after entry.
- A trader who wants the analyzer is guided through Moomoo setup before being
  sent to Daily Trade Tracker. A trader who does not want it goes straight to
  Daily Trade Tracker.
- During beta, every TraderLink member has Trade Analyzer access. Moomoo
  connection supplies the market data for chart-based reviews; it is not a paid
  feature gate or a separate eligibility choice in this guide.
- Moomoo is a market-data connection. The copy must say that a free Moomoo
  account is sufficient and that the trader does not need to open a Moomoo
  trading or brokerage account. It must not imply trade execution, account
  import, password collection or trading authority.
- Daily Trade Tracker remains the only current route for the Trade Analyzer
  workflow. The guide never promises that an open first execution is already a
  completed analyzable trade.

## 3. Workspace guide: visual design

### 3.1 Placement and appearance

- Show a single full-width light-Material `DashboardPanel` directly after the
  existing Workspace Welcome copy and before the normal dashboard cards.
- Use the title **Get started tracking your trades**. Do not add a generic page
  subtitle or replace the existing Workspace heading.
- Keep the panel calm and readable: normal surface color, existing card border,
  no illustration, no celebratory checklist, no countdown, and no overlay that
  blocks navigation.
- The guide is account-safe and user-specific. It never displays other account
  facts, P/L, statement information, market data, or an invented progress
  percentage.

### 3.2 Content hierarchy

The content stays inside one parent panel, in this exact order:

1. **How trades are built**

   > TradersLink uses your buy and sell executions to automatically build your
   > trades. An execution is one buy or sell. A trade starts when you open a
   > position and ends when your position returns to zero. Buy 100 shares, then
   > sell 100 shares = one completed trade. If you add and reduce shares along
   > the way but never reach zero, it is still one trade until the remaining
   > shares are closed.

2. **Trade Tracker**

   > TradersLink offers several ways to enter your trades, but you will get the
   > most value from Daily Trade Tracker.
   >
   > Add the buy and sell executions from your trading day, then use notes,
   > tags, and trading rules to capture what happened and learn from each trade.

3. **Trade Analyzer**

   > Trade Analyzer builds on eligible completed trades from Daily Trade
   > Tracker. It helps you review how you entered, exited, sized, held, and
   > managed a trade.
   >
   > While TradersLink is in beta, connect a free Moomoo account to provide the
   > market data needed for chart-based trade reviews.

4. **Actions**

   - Primary: **Start using Daily Trade Tracker**
   - Secondary: **Set up Trade Analyzer first**
   - Quiet supporting line: `Other ways to enter trades: Quick Trade Entry,
     Swing Trade Entry, and Import statements.`

The supporting line is informational, not a competing fourth set of calls to
action. It may link to the current entry routes only after the owner accepts
the exact interaction treatment.

### 3.3 Responsive layout

| Viewport | Layout |
| --- | --- |
| Desktop | Intro spans the panel width; Trade Tracker and Trade Analyzer sit in two equal readable columns beneath it; actions align at the bottom with Daily first. |
| Tablet | Keep the same information order; columns may remain side by side only when neither body copy becomes cramped. Actions wrap cleanly. |
| Mobile | One vertical stack: trade explanation, Trade Tracker, Trade Analyzer, primary action, secondary action, then the quiet alternatives line. Both actions are full-width. |

No essential guidance, choice, or action is hidden behind a hover, tooltip,
accordion, horizontal scroll region, or desktop-only layout.

## 4. Moomoo setup path

Selecting **Set up Trade Analyzer first** changes the guide into a temporary
Moomoo-setup state. It does not open a second Dashboard shell.

### 4.1 Setup state

**Title:** `Connect Moomoo for Trade Analyzer`

> Connect your existing Moomoo account, or create a free Moomoo account. You
> do not need to open a Moomoo trading or brokerage account.

Actions, in order:

1. **I have a Moomoo account — Connect Moomoo**
2. **Create a free Moomoo account**
3. **Continue to Daily Trade Tracker without Trade Analyzer**

The creation action opens Moomoo's public site. It does not claim the user has
created an account on return. The connection action uses the existing
authorization experience and must request only the market-data scope required
for the analyzer.

### 4.2 Successful connection handoff

After a verified connection, return directly to the Daily Trade Tracker guide:

**Moomoo is connected**

> Your eligible completed trades can now receive chart-based Trade Analyzer
> reviews.

The Tracker shows this connection confirmation beside its final entry guidance.
The return target is Daily Trade Tracker, not a generic Account page, Workspace
success screen, or a new onboarding route.

### 4.3 Cancelled or unsuccessful connection

Never strand a trader in setup. Show a direct, plain-language message and only
these choices:

- **Try again**
- **Continue to Daily Trade Tracker without Trade Analyzer**

No connection failure changes Journal executions, account selection, imports or
the normal Workspace dashboard.

## 5. Daily Trade Tracker handoff

Both Workspace choices lead to the existing `/trade-tracker` route. The guide
there is a compact final callout placed immediately above the existing manual
execution entry form. It must not repeat the earlier explanation of executions
or trades.

**Title:** `Ready to add your first execution`

> Use the form below to enter the exact date, time, price, quantity, and Buy or
> Sell side shown by your broker.

The guide points at the existing form; it does not recreate fields, prefill
facts, submit a trade, or force the trader to close a position before saving a
valid first execution.

After the first accepted execution batch is saved, first-time onboarding is
complete. Trade Analyzer appears later only when its normal truthful eligibility
and completed-trade requirements are met.

## 6. State and privacy contract for later implementation

- No close or dismissal action exists. The guide stays visible on Workspace
  until the member saves their first accepted execution.
- Existing users who already have accepted Journal executions must not see the
  first-time guide merely because this feature is introduced later.
- The accepted-execution fact is the durable completion signal. A live Moomoo
  connection is the only other stored fact the guide reads; temporary OAuth
  return state uses a short-lived cookie.
- A successful Moomoo connection is independent from onboarding completion. It
  records only the existing connection fact and then directs the user to Daily
  Trade Tracker.
- The guide must obey the current user/workspace/account scope on every read,
  write and redirect.

## 7. Explicit non-goals

- No removal or replacement of normal Workspace cards.
- No new Journal ledger, execution form, import path, Moomoo broker import, or
  analyzer engine.
- No Moomoo password, CAPTCHA, MFA, or security-prompt automation.
- No claim that every execution or open trade is eligible for Trade Analyzer.
- No automatic Moomoo connection, account creation, trade import, or Journal
  mutation.
- No paid-plan or separate user-eligibility screen in this beta guide.

## 8. Completed approval and discovery gates

1. [x] Owner approved the desktop and narrow-mobile visual composition in
       section 3.
2. [x] Owner approved the exact Moomoo setup, success and failure copy in
       section 4.
3. [x] Read-only discovery confirmed that Daily Trade Tracker already refreshes
       after a successful accepted execution batch, while the existing Moomoo
       callback currently returns every trader to Account.
4. [x] The narrow implementation boundary below is the approved build plan.

## 9. Narrow implementation boundary

1. Add a user-scoped first-time check that reads accepted Journal execution
   presence. Existing users with any accepted execution do not see the
   Workspace guide; no historical data is copied or changed.
2. Add one responsive client panel to the current Workspace dashboard. It
   follows the approved visual and copy hierarchy, retains every existing card
   and calendar section, and only appears while the user has no accepted
   executions.
3. Extend the existing Moomoo OAuth return with a short-lived, HttpOnly,
   same-site return target cookie. It accepts only the internally chosen
   Daily Trade Tracker handoff, survives the external authorization trip, and
   is cleared on success, failure, or invalid state. Success returns directly
   to the Tracker guide; failure returns to the embedded Workspace Moomoo step.
   No arbitrary `returnTo` value is accepted.
4. Add the compact Daily Trade Tracker callout when the onboarding handoff is
   present. It points at the existing Manual Execution Entry component without
   repeating Step 1. Its normal post-save refresh causes the Workspace guide to
   disappear on the next visit because the accepted-execution check is now true.
5. Leave Moomoo account creation as an external link and retain the existing
   authorization endpoint and scopes. The connection success view sends the
   trader to Daily Trade Tracker; an unsuccessful connection offers retry or
   the same tracker handoff.
6. No Help Center article changes are required: this introduces no new trade,
   Moomoo, or Analyzer behavior. The existing Daily Trade Tracker help already
   documents manual fills, alternative entry paths, and Moomoo chart data.

The slice deliberately adds no persistent onboarding table or migration. A
successful accepted execution is the durable, account-safe completion fact;
the only temporary state is the signed-in browser's short-lived OAuth return
cookie.
