# Nasdaq and NYSE Halt Alerts Plan

**Status:** Implementation active

**Extends:** [Press Release Dashboard Plan](press-release-dashboard-plan.md)

## Outcome

Traders who select **Halt Alerts (Nasdaq/NYSE)** receive Push notifications for qualifying Nasdaq and NYSE halt events. They can mute one ticker through the end of that trading day from the Halt Alerts drawer or the notification itself without turning the alert stream off.

## Approved alert

```text
BCD halted — 10:14:32 ET
News pending (T1).
Nasdaq expects quotes at 10:25 ET; trading at 10:30 ET.
```

The alert shows the source exchange, its actual code, and that code's plain-English meaning. It uses only the resumption times published by that exchange.

## Included events

- Nasdaq: T1, T2, T5, T6, T12, LUDP, LUDS, M.
- NYSE equivalents: News Pending, News Dissemination, Single Stock Trading Pause, Extraordinary Market Activity, Information Requested, LULD/volatility pause, and volatility-pause straddle.
- Ignore a Nasdaq T1 recorded exactly at 07:50 ET; the owner identifies those as reverse-split events.
- Exclude all owner-listed compliance, filing, regulatory, administrative, IPO, corporate-action, ETF, market-wide, deletion and resumption-only events.

## Preferences and delivery

- **Halt Alerts (Nasdaq/NYSE)** is a left-navigation drawer. It opens as a full-width mobile card with an X and backdrop close control.
- The drawer keeps the Halt alerts control at the top, followed by Muted Tickers and the existing TradersLink PWA install action.
- Users turn **Halt alerts** on or off in that drawer; it is not automatically enabled.
- A compact status directly below that control distinguishes the preference from actual alert readiness. Green **Halt alerts are ready** requires a current healthy poll of both official sources, valid Push configuration and a Push-enabled device. Amber or red states name the unavailable device, source or service condition without claiming that a halt occurred.
- The drawer can mute a ticker for today and lists the currently muted tickers in small type with an X to unmute each one.
- Help Center keeps brief setup information in Notifications and imports, with a link to one detailed **Halt Alerts** guide under **Tools**.
- Both Discord messages and Push notifications get their own **Select all** control while retaining individual choices.
- A **Mute for today** action on a halt notification mutes that ticker through 8:00 PM Eastern. It automatically returns the ticker's alerts that evening.
- The existing Platform encrypted Web Push transport delivers the alert. The protected `/api/cron/market-halts` endpoint polls Nasdaq and NYSE once a minute after owner UI approval; the Railway scheduler calls it over HTTPS and sends real Push alerts.
- The scheduler stores privacy-safe run outcomes (time and official-source availability only) so the authenticated drawer can show actual readiness; it never stores a user, subscription or Push endpoint in this health record. See [Halt Alert Status Indicator Progress](halt-alert-status-indicator-progress.md).

## Source rules

- Nasdaq: official Trade Halt RSS only, never more frequently than Nasdaq's one-minute guideline.
- NYSE: official current-halts CSV only. Normalize accepted NYSE reason text/codes without claiming a Nasdaq code.
- De-duplicate a halt across sources and notify once per halt/device.

## Verification and launch

Use focused static/type checks and a disposable database initialization during implementation. Do not touch the private Journal database or replace the shared local server. Before launch, verify the deployed scheduler returns official source events and perform a real device Push check.
