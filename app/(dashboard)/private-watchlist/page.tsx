import { randomUUID } from "node:crypto";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { DashboardPage, DashboardPanel, DashboardUnavailableState } from "../../dashboard-template";
import { MembershipForm } from "../../admin/journal/memberships/membership-form";
import { requireTraderLinkPlatformPageIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { evaluateMembershipFeature, isMembershipAccessDenied } from "@/src/modules/platform/server/membership/platform-membership-access";
import { PrivateWatchlistRepository } from "@/src/modules/watchlist/server/private/private-watchlist-repository";
import { formatWatchlistBudget } from "@/src/modules/platform/contracts/membership-watchlist-budget";
import { changePrivateWatchlist } from "./actions";
import { PrivateTicker } from "./private-ticker";
import type { ComponentProps } from "react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PrivateWatchlistPage() {
  const identity = await requireTraderLinkPlatformPageIdentity();
  let entries: ReturnType<PrivateWatchlistRepository["list"]>;
  let usage: ReturnType<PrivateWatchlistRepository["usage"]>;
  let tickers: ComponentProps<typeof PrivateTicker>[];
  try {
    ({ entries, usage, tickers } = withReadonlyPlatformDatabase({}, database => {
      const repository = new PrivateWatchlistRepository(database);
      const at = new Date().toISOString();
      const entries = repository.list(identity.scope.userId, at);
      const allowed = { analysis: evaluateMembershipFeature(database, identity.scope.userId, "private_watchlist.analysis", undefined, at).allowed,
        indicators: evaluateMembershipFeature(database, identity.scope.userId, "private_watchlist.indicators", undefined, at).allowed,
        levels: evaluateMembershipFeature(database, identity.scope.userId, "private_watchlist.levels", undefined, at).allowed };
      return { entries, usage: repository.usage(identity.scope.userId, at), tickers: entries.map(entry => ({
        symbol: entry.symbol, active: entry.state === "active", allowed,
        cards: repository.readCards(identity.scope.userId, entry.symbol, at), history: repository.generationHistory(identity.scope.userId, entry.symbol, at),
      })) };
    }));
  } catch (error) {
    const denied = isMembershipAccessDenied(error);
    return <DashboardPage><DashboardPanel title="Private Watchlist"><DashboardUnavailableState
      title={denied ? "Private Watchlist access required" : "Private Watchlist unavailable"}
      description={denied ? "View plans that include your own private ticker list." : "Private Watchlist setup is not complete. Your saved data has not been removed."}
      actionHref={denied ? "/plans?feature=private_watchlist.access" : "/account"}
      actionLabel={denied ? "View plans with this feature" : "View account"} />
    </DashboardPanel></DashboardPage>;
  }
  return <DashboardPage>
    <DashboardPanel title="Private Watchlist">
      <details><summary>Remaining allowances</summary><ul>
        <li>Ticker additions: {usage.tickerAdditionsRemaining ?? "Unlimited"}</li>
        <li>Active ticker slots: {usage.activeTickerSlotsRemaining ?? "Unlimited"}</li>
        <li>Generations: {usage.generationsRemaining ?? "Unlimited"}</li>
        <li>Generation budget: {formatWatchlistBudget(usage.budgetRemainingMicrousd)}</li>
      </ul><Typography>Each allowance follows its own plan period or owner override. Pending work holds its allowance until its outcome is confirmed.</Typography>
        {usage.pending.count ? <Typography>{usage.pending.count} generation requests are pending confirmation. Retrying does not create a new paid request.</Typography> : null}
      </details>
      <MembershipForm action={changePrivateWatchlist} label="Add ticker">
        <input type="hidden" name="operation" value="add" /><input type="hidden" name="requestId" value={randomUUID()} />
        <TextField required name="symbol" label="Ticker" helperText="Only you can access this list. Adding a ticker does not generate analysis or send notifications." />
      </MembershipForm>
      <Stack spacing={2} sx={{ mt: 3 }}>
        {!entries.length ? <Typography>No private tickers yet.</Typography> : null}
        {entries.map(entry => <Stack key={entry.symbol} direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ alignItems: { sm: "center" } }}>
          <Typography sx={{ flex: 1, fontWeight: 700 }}>{entry.symbol} · {entry.state === "active" ? "Active" : "Archived"}</Typography>
          <MembershipForm action={changePrivateWatchlist} label={entry.state === "active" ? "Archive ticker" : "Reactivate ticker"}>
            <input type="hidden" name="operation" value={entry.state === "active" ? "archive" : "add"} />
            <input type="hidden" name="symbol" value={entry.symbol} /><input type="hidden" name="requestId" value={randomUUID()} />
          </MembershipForm>
        </Stack>)}
      </Stack>
      <Stack spacing={3} sx={{ mt: 3 }}>{tickers.map(ticker => <details key={ticker.symbol}>
        <summary>{ticker.symbol} saved cards</summary><PrivateTicker {...ticker} />
      </details>)}</Stack>
    </DashboardPanel>
  </DashboardPage>;
}
