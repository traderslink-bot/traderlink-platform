"use client";

import HelpOutlineRoundedIcon from "@mui/icons-material/HelpOutlineRounded";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useState } from "react";

import type {
  LiveWatchlistCardContent,
  LiveWatchlistLevelMap,
  LiveWatchlistLevelMapLevel,
} from "@/src/lib/live-watchlist/live-watchlist-types";
import type {
  StockLevelsLevel,
  StockLevelsMap,
  StockLevelsResult,
} from "@/src/modules/stock-levels/stock-levels-contract";
import { WatchlistV2PotentialPathCard } from "../../watchlist/potential-path-levels-card";
import {
  DashboardPage,
  DashboardPanel,
  DashboardPrimaryAction,
  DashboardSecondaryAction,
} from "../../dashboard-template";

function formatPrice(value: number): string {
  return value >= 1 ? value.toFixed(2) : value.toFixed(4);
}

function eastern(value: number): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/New_York",
  }).format(new Date(value));
}

function levelLabel(level: StockLevelsLevel): string {
  return `${formatPrice(level.price)} (${[level.strength, level.type, level.timeframeSources.join(", ")]
    .filter(Boolean)
    .join(" / ")})`;
}

function asWatchlistLevel(level: StockLevelsLevel): LiveWatchlistLevelMapLevel {
  const formedAt = level.formedAt;
  return {
    side: level.side,
    price: level.price,
    distancePct: level.distancePct,
    strengthLabel: level.strength,
    sourceLabel: [level.type, level.timeframeSources.join(", ")].filter(Boolean).join(" / "),
    ...(formedAt === null
      ? {}
      : {
          marketDataProvenance: {
            formedAt,
            sourceLastSeenAt:
              level.lastConfirmedAt ?? level.lastTestedAt ?? formedAt,
            ...(level.lastTestedAt === null ? {} : { lastTestedAt: level.lastTestedAt }),
            ...(level.lastConfirmedAt === null ? {} : { lastConfirmedAt: level.lastConfirmedAt }),
          },
        }),
    label: levelLabel(level),
  };
}

function asLevelMap(map: StockLevelsMap): LiveWatchlistLevelMap {
  return {
    currentPrice: map.referencePrice,
    rangeState: "normal",
    nearestSupport: map.nearestSupport ? asWatchlistLevel(map.nearestSupport) : null,
    nearestResistance: map.nearestResistance ? asWatchlistLevel(map.nearestResistance) : null,
    nextStrongSupport: null,
    nextStrongResistance: null,
    supportLevels: map.support.map(asWatchlistLevel),
    resistanceLevels: map.resistance.map(asWatchlistLevel),
  };
}

function fullLadderBody(map: StockLevelsMap): string {
  const line = (level: StockLevelsLevel) => {
    const dates = [
      level.formedAt === null ? null : `formed ${eastern(level.formedAt)}`,
      level.lastTestedAt === null ? null : `tested ${eastern(level.lastTestedAt)}`,
      level.lastConfirmedAt === null ? null : `confirmed ${eastern(level.lastConfirmedAt)}`,
    ].filter(Boolean);
    return `- ${levelLabel(level)}${dates.length ? ` — ${dates.join(" · ")}` : ""}`;
  };

  return [
    "Support",
    ...map.fullLadder.support.map(line),
    "",
    "Resistance",
    ...map.fullLadder.resistance.map(line),
  ].join("\n");
}

function PotentialPathCard({ result }: { result: Extract<StockLevelsResult, { state: "ready" }> }) {
  const { map } = result;
  const fullLadderCard: LiveWatchlistCardContent = {
    title: `${map.symbol} full level ladder`,
    body: fullLadderBody(map),
    updatedAt: map.calculatedAt,
    priceWhenPosted: map.referencePrice,
    source: "stock_levels_runtime",
  };

  return (
    <WatchlistV2PotentialPathCard
      symbol={{
        symbol: map.symbol,
        latestPrice: map.referencePrice,
        updatedAt: map.calculatedAt,
        levelMap: asLevelMap(map),
        cards: {},
      }}
      fullLadderCard={fullLadderCard}
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
            label="Nasdaq or NYSE ticker"
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
