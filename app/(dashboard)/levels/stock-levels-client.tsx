"use client";

import HelpOutlineRoundedIcon from "@mui/icons-material/HelpOutlineRounded";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useEffect, useState } from "react";

import {
  isSavedStockLevelsMap,
  isStockLevelsQuotaFeedback,
  type SavedStockLevelsMap,
  type StockLevelsQuotaFeedback,
  type StockLevelsResult,
} from "@/src/modules/stock-levels/stock-levels-contract";
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

type GeneratedLevelsResult = Readonly<{
  savedMap: SavedStockLevelsMap;
}>;

function generatedLevelsSummary(savedMap: SavedStockLevelsMap): string {
  const { map } = savedMap;
  return `${map.symbol} levels generated when price was ${formatPrice(map.referencePrice)} on ${generatedAt(map.calculatedAt)}`;
}

function PotentialPathCard({ map }: { map: SavedStockLevelsMap["map"] }) {
  return (
    <WatchlistPotentialPathCardArticle
      card={map.nearestSupportResistanceCard}
      fullLadderCard={map.fullLadderCard ?? undefined}
      guideAriaLabel="How Support and Resistance work"
      guideContent={<HelpOutlineRoundedIcon fontSize="small" />}
      guideHref="https://traderslink.pro/watchlist/how-it-works"
      headerLabel="Support and Resistance"
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
  );
}

function GeneratedLevelsCards({
  actionsDisabled,
  onDelete,
  onRegenerate,
  results,
}: {
  actionsDisabled: boolean;
  onDelete: (savedMapId: string) => void;
  onRegenerate: (savedMap: SavedStockLevelsMap) => void;
  results: readonly GeneratedLevelsResult[];
}) {
  return (
    <div className="academy-shell" data-academy-theme="light">
      <div className="academy-container watchlist-container">
        <div className="watchlist-page">
          <section className="watchlist-card-grid">
            {results.map(({ savedMap }, index) => index === 0 ? (
              <PotentialPathCard key={savedMap.savedMapId} map={savedMap.map} />
            ) : (
              <details key={savedMap.savedMapId} className="stock-levels-history-card" data-history-index={index}>
                <summary>
                  <span>{generatedLevelsSummary(savedMap)}</span>
                  <span className="stock-levels-history-actions" onClick={(event) => event.preventDefault()}>
                    <button
                      className="stock-levels-history-action"
                      disabled={actionsDisabled}
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        onRegenerate(savedMap);
                      }}
                      type="button"
                    >
                      Regenerate
                    </button>
                    <button
                      className="stock-levels-history-action"
                      disabled={actionsDisabled}
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        onDelete(savedMap.savedMapId);
                      }}
                      type="button"
                    >
                      Delete
                    </button>
                  </span>
                </summary>
                <PotentialPathCard map={savedMap.map} />
              </details>
            ))}
          </section>
        </div>
      </div>
    </div>
  );
}

export function StockLevelsClient() {
  const [symbol, setSymbol] = useState("");
  const [result, setResult] = useState<StockLevelsResult | null>(null);
  const [quotaFeedback, setQuotaFeedback] = useState<StockLevelsQuotaFeedback | null>(null);
  const [generatedResults, setGeneratedResults] = useState<readonly GeneratedLevelsResult[]>([]);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    void fetch("/api/levels", { cache: "no-store" })
      .then(async (response) => response.json() as Promise<{ savedMaps?: unknown } & Partial<StockLevelsQuotaFeedback>>)
      .then((payload) => {
        if (!active) return;
        if (isStockLevelsQuotaFeedback(payload)) setQuotaFeedback(payload);
        if (!Array.isArray(payload.savedMaps)) return;
        const loaded = payload.savedMaps.flatMap((savedMap) =>
          isSavedStockLevelsMap(savedMap) ? [{ savedMap }] : []);
        setGeneratedResults((current) => [
          ...current,
          ...loaded.filter((loadedResult) => !current.some((currentResult) =>
            currentResult.savedMap.savedMapId === loadedResult.savedMap.savedMapId)),
        ]);
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

  async function requestLevels({
    replaceSavedMapId,
    requestedSymbol = symbol,
  }: Readonly<{
    replaceSavedMapId?: string;
    requestedSymbol?: string;
  }> = {}) {
    setLoading(true);
    setRequestError(null);
    try {
      const response = await fetch("/api/levels", {
        body: JSON.stringify(replaceSavedMapId
          ? { replaceSavedMapId, symbol: requestedSymbol }
          : { symbol: requestedSymbol }),
        headers: { "content-type": "application/json" },
        method: "POST",
      });
      const nextResult = await response.json() as StockLevelsResult;
      setResult(nextResult);
      if (isStockLevelsQuotaFeedback(nextResult)) setQuotaFeedback(nextResult);
      if (nextResult.state === "ready") {
        setGeneratedResults((current) => [
          { savedMap: nextResult.savedMap },
          ...current.filter((item) => item.savedMap.savedMapId !== nextResult.savedMap.savedMapId),
        ]);
      }
    } catch {
      setRequestError("A reliable Stock Levels map is unavailable right now. Try again later.");
    } finally {
      setLoading(false);
    }
  }

  async function deleteSavedMap(savedMapId: string) {
    setRequestError(null);
    try {
      const response = await fetch("/api/levels", {
        body: JSON.stringify({ savedMapId }),
        headers: { "content-type": "application/json" },
        method: "DELETE",
      });
      const payload = await response.json() as { deleted?: unknown } & Partial<StockLevelsQuotaFeedback>;
      const deleted = payload.deleted === true;
      if (isStockLevelsQuotaFeedback(payload)) setQuotaFeedback(payload);
      if (deleted) {
        setGeneratedResults((current) => current.filter((item) => item.savedMap.savedMapId !== savedMapId));
      } else {
        setRequestError("This saved map is unavailable.");
      }
    } catch {
      setRequestError("This saved map is unavailable.");
    }
  }

  const hasNoRequestLimit = quotaFeedback?.remainingHourly === null &&
    quotaFeedback?.remainingNewYorkDay === null && quotaFeedback?.resetAt === null;
  const feedback = hasNoRequestLimit
    ? "No request limit"
    : quotaFeedback
    ? `Your account has ${quotaFeedback.remainingHourly} request${quotaFeedback.remainingHourly === 1 ? "" : "s"} left this hour · ${quotaFeedback.remainingNewYorkDay} left today (New York)`
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

      {generatedResults.length > 0 ? (
        <GeneratedLevelsCards
          actionsDisabled={loading}
          onDelete={(savedMapId) => void deleteSavedMap(savedMapId)}
          onRegenerate={(savedMap) => void requestLevels({
            replaceSavedMapId: savedMap.savedMapId,
            requestedSymbol: savedMap.map.symbol,
          })}
          results={generatedResults}
        />
      ) : null}
      {result?.state === "unavailable" ? (
        <DashboardPanel title="Data unavailable">
          <Typography>Data is not available for this ticker right now, try again later.</Typography>
        </DashboardPanel>
      ) : null}
    </DashboardPage>
  );
}
