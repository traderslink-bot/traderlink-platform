import type { Metadata } from "next";

import {
  DashboardPage,
  DashboardUnavailableState,
} from "../../dashboard-template";
import {
  currentJournalAccountSelectionRef,
  requireTraderLinkPlatformPageScope,
} from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { ManualExecutionEntry } from "../trade-tracker/manual-execution-entry";
import { getReplacementTradeTrackerAccount } from "../trade-tracker/trade-tracker-platform-data";

export const metadata: Metadata = {
  description: "Enter Trade Tracker executions without a tracker review.",
  title: "Quick Trade Entry | TraderLink Platform",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

function currentDateInTimezone(timezone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: timezone,
    year: "numeric",
  }).formatToParts(new Date());
  const part = (type: "day" | "month" | "year") =>
    parts.find((candidate) => candidate.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export default async function QuickTradeEntryPage() {
  const scope = await requireTraderLinkPlatformPageScope();
  const account = getReplacementTradeTrackerAccount(scope);
  if (!account) {
    return (
      <DashboardPage>
        <DashboardUnavailableState
          actionHref="/account"
          actionLabel="Choose a Trade Tracker account"
          description="Select the Trade Tracker account where you want to save executions."
          title="No Trade Tracker account selected"
        />
      </DashboardPage>
    );
  }

  return (
    <DashboardPage>
      <ManualExecutionEntry
        accountCurrency={account.baseCurrency}
        accountTimezone={account.tradingTimezone}
        defaultSessionDate={currentDateInTimezone(account.tradingTimezone)}
        expectedAccountSelectionRef={currentJournalAccountSelectionRef(scope)}
        tracker="quick"
      />
    </DashboardPage>
  );
}
