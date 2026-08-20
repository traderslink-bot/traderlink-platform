import type { Metadata } from "next";

import { OfflineSavedViewCapture } from "@/app/pwa/offline-saved-view-capture";
import {
  createJournalOpenPositionsOfflineViewModel,
  JOURNAL_OPEN_POSITIONS_OFFLINE_ROUTE_VIEW_VERSION,
  JOURNAL_OPEN_POSITIONS_OFFLINE_VIEW_KEY,
  journalOpenPositionsOfflineCoverage,
} from "@/src/modules/journal/contracts/journal-open-positions-offline-view-contracts";
import { withJournalAnalyticsReportingDashboardRuntime } from "@/src/modules/journal-analytics/server/journal-analytics-dashboard-runtime";
import {
  currentJournalAccountSelectionRef,
  requireTraderLinkPlatformPageScope,
} from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { PositionStyleControl } from "../../trade-tracker/position-style-control";
import { getReplacementOpenPositionStyles } from "../../trade-tracker/trade-tracker-platform-data";
import { OpenPositionsView } from "./open-positions-view";

export const metadata: Metadata = {
  title: "Open Positions | TraderLink Platform",
};

export const dynamic = "force-dynamic";

export default async function OpenPositionsPage() {
  const scope = await requireTraderLinkPlatformPageScope();
  const result = await withJournalAnalyticsReportingDashboardRuntime(scope, ({ dashboard }) =>
    dashboard.getOpenPositions(scope));
  const positionStyles = getReplacementOpenPositionStyles(scope);
  const expectedAccountSelectionRef = currentJournalAccountSelectionRef(scope);
  const offlineModel = createJournalOpenPositionsOfflineViewModel({
    positionStyles,
    result,
  });
  const currencies = [...new Set(result.positions.map((position) => position.currency))];
  const timezones = [...new Set(result.positions.map((position) => position.timezone))];
  const positionControls = Object.fromEntries(result.positions.flatMap((position) => {
    const tracking = positionStyles[position.roundTripId];
    if (!tracking) return [];
    return [[
      position.roundTripId,
      <PositionStyleControl
        closed={false}
        expectedAccountSelectionRef={expectedAccountSelectionRef}
        key={position.roundTripId}
        positionRef={tracking.positionRef}
        sourceUi="open_positions"
        style={tracking.style}
      />,
    ]];
  }));

  return (
    <>
      <OfflineSavedViewCapture
        accountTimezone={timezones.length === 1 ? timezones[0] : null}
        calculationVersion={`journal-open:${result.factSetRevisionSha256}`}
        coverage={journalOpenPositionsOfflineCoverage(result)}
        generatedAtUtc={result.asOfUtc}
        model={offlineModel}
        pathname="/trades/open"
        queryIdentity="confirmed-open-positions"
        reportingCurrency={currencies.length === 1 ? currencies[0] : null}
        routeViewVersion={JOURNAL_OPEN_POSITIONS_OFFLINE_ROUTE_VIEW_VERSION}
        viewKey={JOURNAL_OPEN_POSITIONS_OFFLINE_VIEW_KEY}
      />
      <OpenPositionsView
        positionControls={positionControls}
        positionStyles={positionStyles}
        result={result}
      />
    </>
  );
}
