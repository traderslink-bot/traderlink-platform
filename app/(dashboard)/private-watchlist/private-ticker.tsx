import { randomUUID } from "node:crypto";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import { DashboardPanel } from "../../dashboard-template";
import { MembershipForm } from "../../admin/journal/memberships/membership-form";
import { MembershipCheckbox } from "../../admin/journal/memberships/membership-checkbox";
import type { PrivateWatchlistCards } from "@/src/modules/watchlist/server/private/private-watchlist-cards";
import type { PrivateWatchlistRepository } from "@/src/modules/watchlist/server/private/private-watchlist-repository";
import { formatWatchlistBudget } from "@/src/modules/platform/contracts/membership-watchlist-budget";
import { generatePrivateWatchlist } from "./actions";
import { TradersLinkAiReadCard, TechnicalContextCard } from "../../watchlist/live-watchlist-client";
import { WatchlistV2PotentialPathCard } from "../../watchlist/potential-path-levels-card";
import type { LiveWatchlistSymbolState } from "@/src/lib/live-watchlist/live-watchlist-types";

const labels = { analysis: "Trade analysis & preparation", indicators: "Indicators", levels: "Support, resistance & full ladder" } as const;
export function PrivateTicker({ symbol, active, allowed, cards, history }: {
  symbol: string; active: boolean; allowed: Record<keyof typeof labels, boolean>; cards: PrivateWatchlistCards;
  history: ReturnType<PrivateWatchlistRepository["generationHistory"]>;
}) {
  const pending = history.filter(row => row.state === "reserved" || row.state === "unresolved");
  const snapshot: LiveWatchlistSymbolState = { symbol, status: "stale", companyName: null,
    updatedAt: cards.levels?.calculatedAt ?? cards.analysis?.updatedAt ?? cards.indicators?.updatedAt ?? 0,
    firstPostedAt: null, latestPrice: cards.levels?.referencePrice ?? cards.analysis?.priceWhenPosted ?? null,
    nearestSupport: cards.levels?.levelMap?.nearestSupport?.price ?? null, nearestResistance: cards.levels?.levelMap?.nearestResistance?.price ?? null,
    latestTraderReadHeadline: null, levelMap: cards.levels?.levelMap, cards: {} };
  return <Stack spacing={2}>
    {pending.map(row => <MembershipForm key={row.request_id} action={generatePrivateWatchlist} label="Check generation status">
      <input type="hidden" name="operation" value="reconcile" /><input type="hidden" name="requestId" value={row.request_id} />
      <Typography>Requested {row.created_at_utc}. Budget held: {formatWatchlistBudget(row.maximum_cost_microusd)}. Checking does not generate again.</Typography>
    </MembershipForm>)}
    {active && Object.values(allowed).some(Boolean) ? <details><summary>Generate cards</summary>
      <MembershipForm action={generatePrivateWatchlist} label="Generate selected cards">
        <input type="hidden" name="operation" value="generate" /><input type="hidden" name="symbol" value={symbol} />
        <input type="hidden" name="requestId" value={randomUUID()} />
        {(Object.keys(labels) as (keyof typeof labels)[]).map(card => allowed[card]
          ? <MembershipCheckbox key={card} name={card} label={labels[card]} /> : null)}
        <Typography>One request uses one generation allowance. The maximum cost is reserved before generation and adjusted when the actual cost is confirmed. Saved cards are snapshots, not live monitoring.</Typography>
      </MembershipForm>
    </details> : null}
    {(Object.keys(labels) as (keyof typeof labels)[]).map(card => <DashboardPanel key={card} title={labels[card]}>
      {!allowed[card] ? <><Typography>Your plan does not include this feature. Saved work is retained.</Typography>
        <Button href={`/plans?feature=private_watchlist.${card}`} variant="outlined">View plans with this feature</Button></>
        : !cards[card] ? <Typography>No saved result yet.</Typography>
          : card === "levels" ? <WatchlistV2PotentialPathCard symbol={snapshot}
            fullLadderCard={cards.levels!.fullLadderCard ?? undefined} priceNote="Saved reference price" metaLabel="Saved"
            metaValue={new Date(cards.levels!.calculatedAt).toISOString()} />
          : <><Typography variant="caption">Saved {new Date(cards[card]!.updatedAt).toISOString()}</Typography>
            {card === "analysis" ? <TradersLinkAiReadCard card={cards.analysis!} symbol={snapshot} livePrice={null} />
              : <TechnicalContextCard card={cards.indicators!} />}</>}
    </DashboardPanel>)}
    {history.length ? <details><summary>Generation history</summary><ul>{history.map(row => <li key={row.request_id}>
      {row.created_at_utc} · {row.state === "completed" ? "Completed" : row.state === "failed" ? "Failed" : row.state === "released" ? "Not started" : "Awaiting confirmation"}
      {" · "}{formatWatchlistBudget(row.actual_cost_microusd ?? row.maximum_cost_microusd)}{row.actual_cost_microusd === null ? " reserved" : " spent"}
    </li>)}</ul></details> : null}
  </Stack>;
}
