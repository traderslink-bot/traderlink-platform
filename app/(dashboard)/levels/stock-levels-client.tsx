"use client";

import HelpOutlineRoundedIcon from "@mui/icons-material/HelpOutlineRounded";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useState } from "react";

import type { StockLevelsResult } from "@/src/modules/stock-levels/stock-levels-contract";
import { WatchlistV2PotentialPathCard } from "../../watchlist/potential-path-levels-card";
import {
  DashboardPage,
  DashboardPanel,
  DashboardPrimaryAction,
  DashboardSecondaryAction,
} from "../../dashboard-template";

function eastern(value: number): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/New_York",
  }).format(new Date(value));
}

function PotentialPathCard({ result }: { result: Extract<StockLevelsResult, { state: "ready" }> }) {
  const { map } = result;

  return (
    <WatchlistV2PotentialPathCard
      symbol={{
        symbol: map.symbol,
        latestPrice: map.referencePrice,
        updatedAt: map.calculatedAt,
        levelMap: map.levelMap,
        cards: { nearestSupportResistance: map.nearestSupportResistanceCard ?? undefined },
      }}
      fullLadderCard={map.fullLadderCard ?? undefined}
      priceNote="Reference price — not real-time"
      metaLabel="Reference price as of"
      metaValue={`${eastern(map.referencePriceAsOf)} · calculated ${eastern(map.calculatedAt)}`}
    />
  );
}

export function StockLevelsClient() {
  const [symbol, setSymbol] = useState("");
  const [result, setResult] = useState<StockLevelsResult | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function requestLevels() {
    setLoading(true);
    setResult(null);
    setRequestError(null);
    try {
      const response = await fetch("/api/levels", {
        body: JSON.stringify({ symbol }),
        headers: { "content-type": "application/json" },
        method: "POST",
      });
      setResult(await response.json() as StockLevelsResult);
    } catch {
      setRequestError("A reliable Stock Levels map is unavailable right now. Try again later.");
    } finally {
      setLoading(false);
    }
  }

  const feedback = result
    ? `${result.remainingHourly} fresh request${result.remainingHourly === 1 ? "" : "s"} left this hour · ${result.remainingNewYorkDay} left today (New York)`
    : requestError ?? "10 fresh requests per hour and 30 per New York trading day. Shared cache hits do not count.";

  return (
    <DashboardPage>
      <DashboardPanel
        action={(
          <DashboardSecondaryAction href="/help/stock-levels" startIcon={<HelpOutlineRoundedIcon />}>
            Stock Levels Help
          </DashboardSecondaryAction>
        )}
        title="Stock Levels"
      >
        <Box sx={{ display: "grid", gap: 1.25, gridTemplateColumns: { xs: "1fr", sm: "minmax(0, 1fr) auto" } }}>
          <TextField
            autoCapitalize="characters"
            label="Ticker"
            onChange={(event) => setSymbol(event.target.value.toUpperCase())}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !loading) {
                void requestLevels();
              }
            }}
            placeholder="Example: AAPL"
            value={symbol}
          />
          <DashboardPrimaryAction disabled={loading || !symbol.trim()} onClick={() => void requestLevels()}>
            {loading ? "Getting levels…" : "Get Levels"}
          </DashboardPrimaryAction>
        </Box>
        <Typography color="text.secondary" variant="body2">{feedback}</Typography>
      </DashboardPanel>

      <DashboardPanel title="How to read this map">
        <Typography color="text.secondary" variant="body2">
          Real market data and historical candles build this map. It normally reaches roughly 30% around the reference price and can extend farther when structural evidence supports it. Levels are support and resistance areas, not price targets, predictions, or advice. Request a new map after price moves.
        </Typography>
        <Typography color="text.secondary" variant="body2">
          Weak through major describe available structural evidence. Type, clustered/timeframe agreement, role flips and the supplied formed, tested or confirmed dates provide context when available.
        </Typography>
      </DashboardPanel>

      {result?.state === "ready" ? <PotentialPathCard result={result} /> : null}
      {result?.state === "unavailable" ? (
        <DashboardPanel title="Stock Levels unavailable">
          <Typography>{result.message}</Typography>
        </DashboardPanel>
      ) : null}
    </DashboardPage>
  );
}
