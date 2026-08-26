"use client";

import HelpOutlineRoundedIcon from "@mui/icons-material/HelpOutlineRounded";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useState } from "react";

import type { StockLevelsResult } from "@/src/modules/stock-levels/stock-levels-contract";
import { WatchlistPotentialPathCardArticle } from "../../watchlist/potential-path-levels-card";
import {
  DashboardPage,
  DashboardPanel,
  DashboardPrimaryAction,
} from "../../dashboard-template";

function generatedAt(value: number): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "America/New_York",
  })
    .format(new Date(value))
    .replace(",", "")
    .replace(/\s([AP]M)$/u, (_, meridiem: string) => ` ${meridiem.toLowerCase()}`);
}

function formatPrice(value: number): string {
  return value >= 1 ? value.toFixed(2) : value.toFixed(4);
}

function PotentialPathCard({ result }: { result: Extract<StockLevelsResult, { state: "ready" }> }) {
  const { map } = result;

  return (
    <div className="academy-shell" data-academy-theme="light">
      <div className="academy-container watchlist-container">
        <div className="watchlist-page">
          <section className="watchlist-card-grid">
            <WatchlistPotentialPathCardArticle
              card={map.nearestSupportResistanceCard}
              fullLadderCard={map.fullLadderCard ?? undefined}
              guideAriaLabel="How Potential Path Levels work"
              guideContent={<HelpOutlineRoundedIcon fontSize="small" />}
              guideHref="https://traderslink.pro/watchlist/how-it-works"
              priceNote={`price was ${formatPrice(map.referencePrice)} when levels were generated on ${generatedAt(map.calculatedAt)}`}
              priceNoteOwnLine
              showKickerHelp={false}
              showMeta={false}
              showNearestLevels={false}
              showOuterMeta={false}
              showPrice={false}
              symbol={{
                symbol: map.symbol,
                latestPrice: map.referencePrice,
                updatedAt: map.calculatedAt,
                levelMap: map.levelMap,
                cards: { nearestSupportResistance: map.nearestSupportResistanceCard ?? undefined },
              }}
            />
          </section>
        </div>
      </div>
    </div>
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
    ? `Your account has ${result.remainingHourly} request${result.remainingHourly === 1 ? "" : "s"} left this hour · ${result.remainingNewYorkDay} left today (New York)`
    : requestError ?? "Each account has 5 requests per hour and 15 per New York trading day.";

  return (
    <DashboardPage>
      <DashboardPanel title="Support and Resistance Generator">
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

      {result?.state === "ready" ? <PotentialPathCard result={result} /> : null}
      {result?.state === "unavailable" ? (
        <DashboardPanel title="Data unavailable">
          <Typography>Data is not available for this ticker right now, try again later.</Typography>
        </DashboardPanel>
      ) : null}
    </DashboardPage>
  );
}
