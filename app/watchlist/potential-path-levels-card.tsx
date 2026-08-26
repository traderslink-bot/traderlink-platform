"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import type {
  LiveWatchlistCardContent,
  LiveWatchlistLevelMap,
  LiveWatchlistSymbolState,
} from "@/src/lib/live-watchlist/live-watchlist-types";
import { formatLevelMarketDataProvenance } from "@/src/lib/live-watchlist/live-watchlist-level-provenance";
import {
  buildWatchlistV2LevelRows,
  formatWatchlistV2LevelDistance,
  formatWatchlistV2LevelPrice,
  type WatchlistV2LevelRow,
} from "@/src/lib/live-watchlist/watchlist-v2-levels";

const watchlistTimeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  second: "2-digit",
  timeZone: "America/Toronto",
});

type PotentialPathSymbol = Pick<
  LiveWatchlistSymbolState,
  | "symbol"
  | "latestPrice"
  | "updatedAt"
  | "marketDataStatus"
  | "marketDataStatusReason"
  | "levelMap"
  | "cards"
>;

const potentialPathHelpText =
  "These levels are not price targets. They are filtered support and resistance map areas for context, usually mapped roughly 30% from the current price when enough useful levels are available.";

function formatPrice(value: number | null): string {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "n/a";
  }
  return value >= 1 ? value.toFixed(2) : value.toFixed(4);
}

function formatTime(value: number): string {
  return watchlistTimeFormatter.format(new Date(value));
}

function stripInternalAtrLevelWording(value: string): string {
  return value.replace(
    /[ \t]+(?:—|-)[ \t]+(?:inside normal 5m movement|meaningful room|meaningful separation)[ \t]+\(\d+(?:\.\d+)?[ \t]+ATR\)[ \t]*$/gim,
    "",
  );
}

function formatLevelMeta(level: WatchlistV2LevelRow): string {
  return [level.strengthLabel, level.sourceLabel].filter(Boolean).join(" / ") || "level";
}

function WatchlistV2LevelRowItem({ level }: { level: WatchlistV2LevelRow }) {
  const provenance = formatLevelMarketDataProvenance(level);
  return (
    <li
      className="watchlist-v2-level-row"
      data-side={level.side}
      data-nearest={level.isNearest ? "true" : "false"}
    >
      <span className="watchlist-v2-level-price">{formatWatchlistV2LevelPrice(level)}</span>
      <span className="watchlist-v2-level-distance">
        {formatWatchlistV2LevelDistance(level)}
      </span>
      <span className="watchlist-v2-level-meta">
        <span>{formatLevelMeta(level)}</span>
        {provenance ? (
          <span className="watchlist-level-provenance">{provenance}</span>
        ) : null}
      </span>
    </li>
  );
}

function WatchlistV2LevelSection({
  title,
  side,
  levels,
}: {
  title: string;
  side: "support" | "resistance";
  levels: WatchlistV2LevelRow[];
}) {
  return (
    <section className="watchlist-v2-level-section" data-side={side}>
      <h3>{title}</h3>
      {levels.length > 0 ? (
        <ul className="watchlist-v2-level-list">
          {levels.map((level) => (
            <WatchlistV2LevelRowItem
              key={`${level.side}-${level.price}-${level.distancePct}-${level.label}`}
              level={level}
            />
          ))}
        </ul>
      ) : (
        <p className="watchlist-v2-level-empty">No curated {side} levels yet.</p>
      )}
    </section>
  );
}

function WatchlistV2NearestLevels({ levelMap }: { levelMap: LiveWatchlistLevelMap }) {
  return (
    <div className="watchlist-v2-nearest" aria-label="Nearest levels">
      <div className="watchlist-v2-nearest-item" data-side="support">
        <span>Nearest support</span>
        <strong>
          {levelMap.nearestSupport
            ? stripInternalAtrLevelWording(levelMap.nearestSupport.label)
            : "n/a"}
        </strong>
      </div>
      <div className="watchlist-v2-nearest-item" data-side="resistance">
        <span>Nearest resistance</span>
        <strong>
          {levelMap.nearestResistance
            ? stripInternalAtrLevelWording(levelMap.nearestResistance.label)
            : "n/a"}
        </strong>
      </div>
    </div>
  );
}

function formatCardBody(value: string): string {
  return value
    .replace(/`r`n/g, "\n")
    .replace(/`n/g, "\n")
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n");
}

function cleanGenericCardBody(card: LiveWatchlistCardContent): string {
  const body = formatCardBody(card.body).trim();
  const lines = body.split("\n");
  const withoutTitle =
    lines[0]?.trim().toLowerCase() === card.title.trim().toLowerCase()
      ? lines.slice(1)
      : lines;
  return withoutTitle
    .filter((line) => !/^Price:\s*/i.test(line.trim()))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function cleanLevelMapCardBody(card: LiveWatchlistCardContent): string {
  return stripInternalAtrLevelWording(cleanGenericCardBody(card))
    .split("\n")
    .filter((line) => !/^Current price:/i.test(line.trim()))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function WatchlistV2FallbackLevels({ symbol }: { symbol: PotentialPathSymbol }) {
  const card = symbol.cards.nearestSupportResistance;
  return (
    <div className="watchlist-v2-fallback-levels">
      {card ? (
        <pre>{cleanLevelMapCardBody(card)}</pre>
      ) : (
        <p>Closest levels are still loading for this ticker.</p>
      )}
    </div>
  );
}

function WatchlistPotentialPathCardKicker({
  headerLabel = "Potential Path Levels",
  showHelp = true,
}: {
  headerLabel?: string;
  showHelp?: boolean;
}) {
  return (
    <p className="academy-kicker watchlist-card-kicker">
      <span>{headerLabel}</span>
      {showHelp ? (
        <button
          type="button"
          className="watchlist-card-help"
          aria-label={`${headerLabel} help`}
          data-tooltip={potentialPathHelpText}
          title={potentialPathHelpText}
        >
          ?
        </button>
      ) : null}
    </p>
  );
}

export function WatchlistV2PotentialPathCard({
  symbol,
  fullLadderCard,
  priceNote = "(delayed 15 sec)",
  metaLabel = "Updated",
  metaValue,
  showNearestLevels = true,
  showPrice = true,
  showMeta = true,
  priceNoteOwnLine = false,
}: {
  symbol: PotentialPathSymbol;
  fullLadderCard?: LiveWatchlistCardContent;
  priceNote?: string;
  metaLabel?: string;
  metaValue?: string;
  showNearestLevels?: boolean;
  showPrice?: boolean;
  showMeta?: boolean;
  priceNoteOwnLine?: boolean;
}) {
  const levelMap = symbol.levelMap ?? null;
  const levelRows = buildWatchlistV2LevelRows(levelMap);
  const fullLadderBody = fullLadderCard
    ? cleanGenericCardBody(fullLadderCard)
        .replace(/\bheavy\b/gi, "strong")
        .replace(/\blight\b/gi, "weak")
    : null;

  return (
    <div className="watchlist-v2-potential-path-card">
      <article className="watchlist-v2-card">
        <header className="watchlist-v2-card-header">
          <div className="watchlist-v2-card-title">
            <h2>{symbol.symbol}</h2>
            {symbol.marketDataStatus === "halted" || symbol.marketDataStatus === "possible_halt" ? (
              <span
                className="watchlist-potential-path-status"
                data-market-data-status={symbol.marketDataStatus}
                title={symbol.marketDataStatusReason ?? undefined}
              >
                {symbol.marketDataStatus === "halted"
                  ? "HALTED - Nasdaq confirmed"
                  : "POSSIBLE HALT - confirmation pending"}
              </span>
            ) : null}
            {showPrice ? <span>{formatPrice(symbol.latestPrice)}</span> : null}
            <small className="watchlist-price-delay-note" data-own-line={priceNoteOwnLine ? "true" : undefined}>{priceNote}</small>
          </div>
          <small className="watchlist-potential-path-note">Support and Resistance</small>
        </header>

        {showMeta ? (
          <dl className="watchlist-v2-card-meta">
            <div>
              <dt>{metaLabel}</dt>
              <dd>{metaValue ?? formatTime(symbol.updatedAt)}</dd>
            </div>
          </dl>
        ) : null}

        {levelMap ? (
          <>
            {showNearestLevels ? <WatchlistV2NearestLevels levelMap={levelMap} /> : null}
            <div className="watchlist-v2-level-columns">
              <WatchlistV2LevelSection title="Support" side="support" levels={levelRows.support} />
              <WatchlistV2LevelSection title="Resistance" side="resistance" levels={levelRows.resistance} />
            </div>
          </>
        ) : (
          <WatchlistV2FallbackLevels symbol={symbol} />
        )}
      </article>

      {fullLadderBody ? (
        <details className="watchlist-more-levels">
          <summary>Full ladder</summary>
          <div className="watchlist-full-ladder-detail">
            <h3>Full level ladder</h3>
            <pre>{fullLadderBody}</pre>
          </div>
        </details>
      ) : null}
    </div>
  );
}

export function WatchlistPotentialPathCardArticle({
  card,
  fullLadderCard,
  headerLabel,
  guideAriaLabel,
  guideContent = "How it works",
  guideHref = "/watchlist/how-it-works",
  priceNote,
  priceNoteOwnLine,
  showKickerHelp = true,
  showMeta,
  showNearestLevels,
  showOuterMeta = true,
  showPrice,
  symbol,
}: {
  card: LiveWatchlistCardContent | null | undefined;
  fullLadderCard?: LiveWatchlistCardContent;
  headerLabel?: string;
  guideAriaLabel?: string;
  guideContent?: ReactNode;
  guideHref?: string;
  priceNote?: string;
  priceNoteOwnLine?: boolean;
  showKickerHelp?: boolean;
  showMeta?: boolean;
  showNearestLevels?: boolean;
  showOuterMeta?: boolean;
  showPrice?: boolean;
  symbol: PotentialPathSymbol;
}) {
  const hasContent = Boolean(card);

  return (
    <article className="academy-card watchlist-content-card" data-card-label="Potential Path Levels">
      <div className="academy-card-topline">
        <WatchlistPotentialPathCardKicker headerLabel={headerLabel} showHelp={showKickerHelp} />
        <Link
          aria-label={guideAriaLabel}
          className="watchlist-card-guide-link"
          href={guideHref}
        >
          {guideContent}
        </Link>
      </div>
      {hasContent ? (
        <>
          <WatchlistV2PotentialPathCard
            symbol={symbol}
            fullLadderCard={fullLadderCard}
            priceNote={priceNote}
            priceNoteOwnLine={priceNoteOwnLine}
            showMeta={showMeta}
            showNearestLevels={showNearestLevels}
            showPrice={showPrice}
          />
          {card && showOuterMeta ? (
            <p className="watchlist-card-meta">
              Updated {formatTime(card.updatedAt)} | Price when posted {formatPrice(card.priceWhenPosted)}
            </p>
          ) : null}
        </>
      ) : (
        <>
          <h2 className="academy-card-title">Waiting for content</h2>
          <p className="academy-card-text">
            This card will fill in when the runtime publishes the next matching update.
          </p>
        </>
      )}
    </article>
  );
}
