import "server-only";
import calendar from "@/src/modules/coach/server/market-calendar/us-equities-review-calendar.v1.json";
import type { IndicatorCalendar } from "@/src/lib/live-watchlist/indicators/indicator-sessions";
import type { IndicatorCalculationEvidence } from "../indicators/indicator-audit-store";
import { evaluateWatchlistSetups, WATCHLIST_SETUP_RULES_VERSION } from "@/src/lib/live-watchlist/setups/setup-engine";
import type { WatchlistSetupInput, SetupFrameInput } from "@/src/lib/live-watchlist/setups/setup-input";
import type { WatchlistSetupMemberSnapshot } from "@/src/lib/live-watchlist/setups/setup-contracts";
import { savedSetupPublicationIdentity, watchlistSetupStore } from "./setup-store";
import { watchlistIndicatorAuditStore } from "../indicators/indicator-audit-runtime";

const runtimeFailures = new Map<string, { at: number; reason: "evaluation_or_storage_unavailable" }>();
export function readWatchlistSetupRuntimeFailure(identity: string) { return runtimeFailures.get(identity) ?? null; }

/** Piggybacks the existing accepted calculation. Never requests more candles. */
export async function recordAcceptedWatchlistSetupCalculation(evidence: IndicatorCalculationEvidence): Promise<void> {
  try {
    await recordCalculation(evidence);
    runtimeFailures.delete(evidence.activationId);
  } catch {
    if (savedSetupPublicationIdentity.test(evidence.activationId)) {
      runtimeFailures.delete(evidence.activationId);
      runtimeFailures.set(evidence.activationId, { at: Date.now(), reason: "evaluation_or_storage_unavailable" });
      if (runtimeFailures.size > 256) runtimeFailures.delete(runtimeFailures.keys().next().value!);
    }
    // No raw transport errors or credentials enter this independent audit status.
  }
}

async function recordCalculation(evidence: IndicatorCalculationEvidence): Promise<void> {
  // An old symbol:timestamp activation is not a saved publication UUID.
  if (!savedSetupPublicationIdentity.test(evidence.activationId)) return;
  const store = watchlistSetupStore(), configuration = await store.configuration();
  if (!configuration.settings.enabled || configuration.tickerOverrides[evidence.activationId] === false) return;
  const previous = await store.latest(evidence.symbol, evidence.activationId);
  if (previous?.input.revision === evidence.id && previous.configurationRevision === configuration.revision
    && previous.evaluation.rulesVersion === WATCHLIST_SETUP_RULES_VERSION) return;
  const frame = (timeframe: "1m" | "5m"): SetupFrameInput | null => {
    const source = evidence.timeframes.find(item => item.timeframe === timeframe);
    return source?.provider === "moomoo" && source.initialCheckpoint ? { provider: source.provider, adjustment: source.adjustment,
      seriesKey: source.seriesKey, seed: source.initialCheckpoint, candles: source.candles } : null;
  };
  const input: WatchlistSetupInput = { symbol: evidence.symbol, publicationIdentity: evidence.activationId,
    revision: evidence.id, receivedAt: Math.max(evidence.createdAt, Date.now()), calendar: calendar as IndicatorCalendar,
    oneMinute: frame("1m"), fiveMinute: frame("5m") };
  const evaluation = evaluateWatchlistSetups(input, configuration.settings);
  // Preserve first recorded recognition on an unchanged structural identity.
  const known = new Map(previous?.evaluation.instances.map(instance => [instance.id, instance]) ?? []);
  const instances = evaluation.instances.map(instance => ({ ...instance, firstRecognizedAt: known.get(instance.id)?.firstRecognizedAt ?? instance.firstRecognizedAt }));
  const transitionKey = (event: typeof evaluation.transitions[number]) => `${event.instanceId}:${event.state}:${event.candleCompletedAt}:${event.reason}`;
  const earlierEvents = new Map(previous?.evaluation.transitions.map(event => [transitionKey(event), event]) ?? []);
  const transitions = evaluation.transitions.map(event => ({ ...event, knownAt: earlierEvents.get(transitionKey(event))?.knownAt ?? event.knownAt }));
  const instanceMap = new Map(instances.map(instance => [instance.id, instance]));
  const adjusted = { ...evaluation, instances, transitions, snapshot: { ...evaluation.snapshot,
    groups: evaluation.snapshot.groups.map(group => ({ ...group, members: group.members.map(member => instanceMap.get(member.id)!) })),
    history: evaluation.snapshot.history?.map(member => instanceMap.get(member.id)!) } };
  await store.save({ version: 1, configurationRevision: configuration.revision, input, evaluation: adjusted });
}

/** A settings change or restart can reuse retained evidence without another request. */
export async function ensureWatchlistSetupsFromSavedCalculation(symbol: string, identity: string): Promise<void> {
  if (!savedSetupPublicationIdentity.test(identity)) return;
  const store = watchlistSetupStore(), configuration = await store.configuration();
  if (!configuration.settings.enabled || configuration.tickerOverrides[identity] === false) return;
  const record = await store.latest(symbol, identity);
  if (record?.configurationRevision === configuration.revision && record.evaluation.rulesVersion === WATCHLIST_SETUP_RULES_VERSION) return;
  const evidence = await watchlistIndicatorAuditStore().latestCalculation(symbol, identity);
  if (evidence) await recordAcceptedWatchlistSetupCalculation(evidence);
}

/** Cached member read only; no evaluation, provider call or worker initialization. */
export async function readWatchlistSetupSnapshot(symbol: string, identity: string, now = Date.now()): Promise<WatchlistSetupMemberSnapshot | null> {
  if (!savedSetupPublicationIdentity.test(identity)) return null;
  const store = watchlistSetupStore(), configuration = await store.configuration();
  if (!configuration.settings.enabled || !configuration.settings.showMemberCard || configuration.tickerOverrides[identity] === false) return null;
  const record = await store.latest(symbol, identity);
  if (!record || record.configurationRevision !== configuration.revision || record.evaluation.rulesVersion !== WATCHLIST_SETUP_RULES_VERSION) return { version: "watchlist-setups-v1", symbol,
    publicationIdentity: identity, monitoringEnabled: true, availability: "warming-up", dataThrough: null, groups: [] };
  const snapshot = record.evaluation.snapshot;
  const stillCurrent = (member: typeof snapshot.groups[number]["members"][number]) => member.priceState === "forming"
    ? now <= member.deadlineAt : member.priceState === "confirmed" && now < (member.recentlyConfirmedUntil ?? 0);
  const groups = snapshot.groups.map(group => ({ ...group, members: group.members.filter(stillCurrent) })).filter(group => group.members.length > 0);
  const aged = snapshot.groups.flatMap(group => group.members.filter(member => !stillCurrent(member)));
  return { ...snapshot, groups, history: [...aged, ...(snapshot.history ?? [])].slice(0, 20),
    availability: snapshot.dataThrough === null || now - snapshot.dataThrough > 120_000 ? "unavailable" : snapshot.availability };
}
