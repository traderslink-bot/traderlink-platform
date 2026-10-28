import type { LiveWatchlistCardContent, LiveWatchlistLevelMapLevel, LiveWatchlistSymbolState } from "./live-watchlist-types";
import { hasObservedResistanceEvidence, isSyntheticResistance, NO_HIGHER_RESISTANCE, type ResistanceEvidence } from "./resistance-evidence";

type Evidence = ResistanceEvidence & { price?: number };
const samePrice = (a: number, b: number) => Math.abs(a - b) <= Math.max(0.000001, a * 0.0000001);

/** Current read projection only. Never saves state, rewrites an analysis or requests data. */
export function historicalResistanceView(state: LiveWatchlistSymbolState): LiveWatchlistSymbolState {
  const map = state.levelMap;
  if (!map) return state;
  const evidence: Evidence[] = [...map.resistanceLevels];
  const full = state.cards.fullLadder;
  try {
    const value = full?.metadata?.resistanceEvidence;
    const rows = typeof value === "string" && value.length < 100000 ? JSON.parse(value) : null;
    if (Array.isArray(rows) && rows.length <= 1000) evidence.push(...rows.filter(row => row && typeof row === "object" && Number.isFinite(row.price)));
  } catch { /* Unknown old metadata is not evidence. */ }
  const observedAt = (price: number) => evidence.some(row => typeof row.price === "number" && samePrice(price, row.price) && !isSyntheticResistance(row) && hasObservedResistanceEvidence(row));
  const retainedAt = (price: number) => evidence.some(row => typeof row.price === "number" && samePrice(price, row.price) && !isSyntheticResistance(row));
  const removed = map.resistanceLevels.filter(isSyntheticResistance);
  const resistances = map.resistanceLevels.filter(row => !isSyntheticResistance(row));
  const blockedAt = (price: number) => removed.some(row => samePrice(price, row.price)) && !observedAt(price);
  const notice = map.dataQuality?.status === "unavailable" ? "Historical resistance data is unavailable." : NO_HIGHER_RESISTANCE;

  function cardView(card: LiveWatchlistCardContent | null | undefined): LiveWatchlistCardContent | null | undefined {
    if (!card || !["level_snapshot", "live_level_map", "level_extension"].includes(card.source)) return card;
    let resistanceSection = false, changed = false;
    const body = card.body.split(/\r?\n/).filter(line => {
      if (/^\s*Resistance(?: path)?:\s*$/i.test(line)) resistanceSection = true;
      else if (/^\s*Support(?: path)?:\s*$/i.test(line)) resistanceSection = false;
      if (!resistanceSection) return true;
      const match = line.match(/^\s*(?:[-•]\s*)?\$?(\d+(?:\.\d+)?)(?=[\s(]|$)/);
      if (!match) return true;
      const price = Number(match[1]);
      // Older text cards lost their per-row counts. Their explicit weak
      // planning-extension signature (legacy "light", current "weak") needs
      // observed corroboration, not trust
      // in a rounded number. Preserve real extensions when evidence exists.
      const planningOnly = /\bcontinuation map\b/i.test(line) ||
        (/\b(?:weak|light)\b/i.test(line) && /\bextension\b/i.test(line) && !retainedAt(price));
      if (blockedAt(price) || planningOnly) { changed = true; return false; }
      return true;
    }).join("\n");
    if (!changed) return card;
    const lines = body.split("\n"), result: string[] = [];
    let inResistance = false, inserted = false;
    for (const line of lines) {
      if (/^\s*Support(?: path)?:\s*$/i.test(line) && inResistance && !inserted) { result.push(notice, ""); inserted = true; inResistance = false; }
      result.push(line);
      if (/^\s*Resistance(?: path)?:\s*$/i.test(line)) inResistance = true;
    }
    if (inResistance && !inserted) result.push(notice);
    return { ...card, body: result.join("\n"), metadata: { ...card.metadata, resistanceHistoryNotice: notice } };
  }
  let nearestCard = cardView(state.cards.nearestSupportResistance);
  const fullCard = cardView(full);
  if (!removed.length && nearestCard === state.cards.nearestSupportResistance && fullCard === full) return state;
  const nearest: LiveWatchlistLevelMapLevel | null = resistances[0] ?? null;
  const nextStrong = resistances.find(row => row !== nearest && (row.strengthLabel === "strong" || row.strengthLabel === "major")) ?? null;
  if (removed.length && nearestCard) nearestCard = { ...nearestCard, metadata: { ...nearestCard.metadata,
    nearestResistance: nearest?.price ?? null, nearestResistanceLabel: nearest?.label ?? null,
    nearestResistanceDistancePct: nearest?.distancePct ?? null,
    nearestResistanceDistanceAtr: nearest && "distanceAtr" in nearest && typeof nearest.distanceAtr === "number" ? nearest.distanceAtr : null,
    nearestResistanceAtrDistanceState: nearest && "atrDistanceState" in nearest && typeof nearest.atrDistanceState === "string" ? nearest.atrDistanceState : null,
    resistanceHistoryNotice: notice,
  } };
  return { ...state,
    levelMap: removed.length ? { ...map, resistanceLevels: resistances, nearestResistance: nearest, nextStrongResistance: nextStrong,
      ...(map.tradePlan ? { tradePlan: { ...map.tradePlan, mustClear: nearest,
        targets: map.tradePlan.targets.filter(row => !isSyntheticResistance(row) && !blockedAt(row.price)),
        openAir: nearest === null || map.tradePlan.openAir } } : {}),
    } : map,
    ...(removed.length ? { nearestResistance: nearest?.price ?? null, nearestResistanceLabel: nearest?.label ?? null } : {}),
    cards: { ...state.cards, ...(nearestCard ? { nearestSupportResistance: nearestCard } : {}), ...(fullCard ? { fullLadder: fullCard } : {}) },
  };
}
