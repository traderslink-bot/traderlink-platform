"use client";
import type { PremiumLevelPreviewRow } from "@/src/lib/live-watchlist/premium-level-preview";
import premiumStyles from "./premium-analysis-card.module.css";
import { WatchlistPlanUpgrade } from "./watchlist-plan-upgrade";

import Link from "next/link";
import { normalizeOvernightLevelReference } from "@/src/lib/live-watchlist/overnight-level-reference";
import styles from "./overnight-price-note.module.css";
import { watchlistPriceNote } from "./watchlist-price-status";
import type { ReactNode } from "react";

import type {
  LiveWatchlistCardContent,
  LiveWatchlistLevelMap,
  LiveWatchlistSymbolState,
} from "@/src/lib/live-watchlist/live-watchlist-types";
import { formatLevelMarketDataProvenance } from "@/src/lib/live-watchlist/live-watchlist-level-provenance";
import { NO_HIGHER_RESISTANCE } from "@/src/lib/live-watchlist/resistance-evidence";
import {
  buildWatchlistV2LevelRows,
  isSessionHighReference,
  labelSessionHighInLadder,
  SESSION_HIGH_NOTICE,
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
  | "premiumLevelsAllowed"
  | "membershipLevelsAllowed"
  | "premiumLevelsPreview"
  | "watchlistUpgradeLinks"
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
  if (level.isSessionHighReference) return "High of day / session reference";
  return [level.strengthLabel, level.sourceLabel].filter(Boolean).join(" / ") || "level";
}

function HiddenLevelValue({ date = false }: { date?: boolean }) {
  return <span className={premiumStyles.price} aria-label={date ? "Date requires feature access" : "Price requires feature access"}>
    <span aria-hidden="true">{date ? "••• ••" : "$••.••"}</span>
  </span>;
}

function LevelRowView({ side, nearest, price, distance, meta, provenance }: {
  side: "support" | "resistance"; nearest: boolean; price: ReactNode; distance: ReactNode; meta: ReactNode; provenance: ReactNode;
}) {
  return <li className="watchlist-v2-level-row" data-side={side} data-nearest={nearest ? "true" : "false"}>
    <span className="watchlist-v2-level-price">{price}</span>
    <span className="watchlist-v2-level-distance">{distance}</span>
    <span className="watchlist-v2-level-meta"><span>{meta}</span>
      {provenance ? <span className="watchlist-level-provenance">{provenance}</span> : null}
    </span>
  </li>;
}

function LockedLevelProvenance({ row }: { row: PremiumLevelPreviewRow }) {
  return <>{row.provenance.map((label, index) => <span key={label}>{index > 0 ? " · " : ""}{label}{" "}<HiddenLevelValue date /></span>)}</>;
}

function LockedLevelRow({ side, row }: { side: "support" | "resistance"; row: PremiumLevelPreviewRow }) {
  return <LevelRowView side={side} nearest={row.nearest} price={<HiddenLevelValue />}
    distance={<span aria-label="Distance requires feature access" className={premiumStyles.price}><span aria-hidden="true">••.•%</span></span>}
    meta={row.sessionHighReference ? "High of day / session reference" : [row.strength, row.source].filter(Boolean).join(" / ") || "level"}
    provenance={row.provenance.length ? <LockedLevelProvenance row={row} /> : null} />;
}

function WatchlistV2LevelRowItem({ level }: { level: WatchlistV2LevelRow }) {
  return <LevelRowView side={level.side} nearest={level.isNearest} price={formatWatchlistV2LevelPrice(level)}
    distance={formatWatchlistV2LevelDistance(level)} meta={formatLevelMeta(level)} provenance={formatLevelMarketDataProvenance(level)} />;
}

function WatchlistV2LevelSection({
  title,
  side,
  levels,
  unavailable = false,
  preview,
}: {
  title: string;
  side: "support" | "resistance";
  levels: WatchlistV2LevelRow[];
  unavailable?: boolean;
  preview?: PremiumLevelPreviewRow[];
}) {
  return (
    <section className="watchlist-v2-level-section" data-side={side}>
      <h3>{title}</h3>
      {preview ? (
        <ul className="watchlist-v2-level-list">{preview.map((row, index) => <LockedLevelRow key={index} side={side} row={row} />)}</ul>
      ) : levels.length > 0 ? (
        <ul className="watchlist-v2-level-list">
          {levels.map((level) => (
            <WatchlistV2LevelRowItem
              key={`${level.side}-${level.price}-${level.distancePct}-${level.label}`}
              level={level}
            />
          ))}
        </ul>
      ) : (
        <p className="watchlist-v2-level-empty">{side === "resistance" ? unavailable ? "Historical resistance data is unavailable." : NO_HIGHER_RESISTANCE : "No curated support levels yet."}</p>
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
        <span>{levelMap.nearestResistance && isSessionHighReference(levelMap.nearestResistance, levelMap) ? "High of day" : "Nearest resistance"}</span>
        <strong>
          {levelMap.nearestResistance
            ? isSessionHighReference(levelMap.nearestResistance, levelMap)
              ? `${formatPrice(levelMap.nearestResistance.price)} (session reference)`
              : stripInternalAtrLevelWording(levelMap.nearestResistance.label)
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
  priceNote = "",
  livePriceAvailable = false,
  liveFeedConnected = false,
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
  livePriceAvailable?: boolean;
  liveFeedConnected?: boolean;
  metaLabel?: string;
  metaValue?: string;
  showNearestLevels?: boolean;
  showPrice?: boolean;
  showMeta?: boolean;
  priceNoteOwnLine?: boolean;
}) {
  const levelMap = symbol.levelMap ?? null;
  const overnight = livePriceAvailable ? null : normalizeOvernightLevelReference(levelMap?.overnightReference);
  const levelRows = buildWatchlistV2LevelRows(levelMap);
  const rawFullLadderBody = fullLadderCard
    ? cleanGenericCardBody(fullLadderCard)
        .replace(/\bheavy\b/gi, "strong")
        .replace(/\blight\b/gi, "weak")
    : null;
  const fullLadderBody = rawFullLadderBody && levelMap ? labelSessionHighInLadder(rawFullLadderBody, levelMap) : rawFullLadderBody;
  const hasSessionHigh = levelRows.resistance.some(level => level.isSessionHighReference);

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
            {showPrice ? <span>{formatPrice(overnight?.price ?? symbol.latestPrice)}</span> : null}
            {!overnight ? <small className="watchlist-price-delay-note" data-own-line={priceNoteOwnLine ? "true" : undefined}>{priceNote}</small> : null}
          </div>
        </header>

        {overnight ? (
          <div className={styles.note} role="note">
            {!liveFeedConnected ? <strong>{watchlistPriceNote({ latestPriceSource: "ticker", latestPriceObservedAt: overnight.observedAt ?? null }, "offline")}</strong> : null}
            <span>Levels use this fixed price until a newer live price arrives.</span>
          </div>
        ) : null}
        {showMeta && !overnight ? (
          <dl className="watchlist-v2-card-meta">
            <div>
              <dt>{metaLabel}</dt>
              <dd>{metaValue ?? formatTime(symbol.updatedAt)}</dd>
            </div>
          </dl>
        ) : null}

        {symbol.premiumLevelsAllowed === false ? (
          <div>
            <WatchlistPlanUpgrade href={symbol.watchlistUpgradeLinks?.levels} feature="Support and Resistance" premium={symbol.membershipLevelsAllowed !== false} />
            {showNearestLevels ? <div className="watchlist-v2-nearest" aria-label="Nearest levels">
              {(["support", "resistance"] as const).map(side => <div key={side} className="watchlist-v2-nearest-item" data-side={side}>
                <span>{side === "resistance" && symbol.premiumLevelsPreview?.resistance.some(row => row.nearest && row.sessionHighReference) ? "High of day" : `Nearest ${side}`}</span><strong><HiddenLevelValue /></strong>
              </div>)}
            </div> : null}
            <div className="watchlist-v2-level-columns">
              <WatchlistV2LevelSection title="Support" side="support" levels={[]} preview={symbol.premiumLevelsPreview?.support ?? []} />
              <WatchlistV2LevelSection title={symbol.premiumLevelsPreview?.resistance.some(row => row.sessionHighReference) ? "Resistance / session high" : "Resistance"} side="resistance" levels={[]} preview={symbol.premiumLevelsPreview?.resistance ?? []} />
            </div>
          </div>
        ) : levelMap ? (
          <>
            {showNearestLevels ? <WatchlistV2NearestLevels levelMap={levelMap} /> : null}
            <div className="watchlist-v2-level-columns">
              <WatchlistV2LevelSection title="Support" side="support" levels={levelRows.support} />
              <WatchlistV2LevelSection title={hasSessionHigh ? "Resistance / session high" : "Resistance"} side="resistance" levels={levelRows.resistance} unavailable={levelMap.dataQuality?.status === "unavailable"} />
            </div>
            {hasSessionHigh ? <p className="watchlist-v2-level-empty" role="note">{SESSION_HIGH_NOTICE}</p> : null}
            {levelRows.resistance.length > 0 && typeof symbol.cards.nearestSupportResistance?.metadata?.resistanceHistoryNotice === "string" ? <p className="watchlist-v2-level-empty">{symbol.cards.nearestSupportResistance.metadata.resistanceHistoryNotice}</p> : null}
          </>
        ) : (
          <WatchlistV2FallbackLevels symbol={symbol} />
        )}
      </article>

      {symbol.premiumLevelsAllowed === false ? (
        <details className="watchlist-more-levels"><summary>Full ladder</summary>
          <div className="watchlist-full-ladder-detail" aria-label="Full ladder requires feature access">
            <h3>Full level ladder</h3>
            <pre>{(["resistance", "support"] as const).map(side => <span key={side}>
              {side === "support" ? "Support" : "Resistance"}{"\n"}
              {(symbol.premiumLevelsPreview?.[side] ?? []).map((row, index) => <span key={index}><HiddenLevelValue />{" — "}{[row.strength, row.source].filter(Boolean).join(" / ")}{" "}<LockedLevelProvenance row={row} />{"\n"}</span>)}
            </span>)}</pre>
          </div>
        </details>
      ) : fullLadderBody ? (
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
  livePriceAvailable,
  liveFeedConnected,
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
  livePriceAvailable?: boolean;
  liveFeedConnected?: boolean;
  priceNoteOwnLine?: boolean;
  showKickerHelp?: boolean;
  showMeta?: boolean;
  showNearestLevels?: boolean;
  showOuterMeta?: boolean;
  showPrice?: boolean;
  symbol: PotentialPathSymbol;
}) {
  const hasContent = Boolean(card) || symbol.premiumLevelsAllowed === false;

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
            livePriceAvailable={livePriceAvailable}
            liveFeedConnected={liveFeedConnected}
            priceNoteOwnLine={priceNoteOwnLine}
            showMeta={showMeta}
            showNearestLevels={showNearestLevels}
            showPrice={showPrice}
          />
          {card && showOuterMeta && !normalizeOvernightLevelReference(symbol.levelMap?.overnightReference) ? (
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
