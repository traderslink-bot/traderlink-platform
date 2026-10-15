import type { LiveWatchlistSymbolState, LiveWatchlistPotentialGain } from './live-watchlist-types';

export type GainTracking = {
  version: 1;
  revision: number;
  override: { price: number; at: number } | null;
  // Suffix maxima retain the exact maximum for any later starting time.
  peaks: Array<{ price: number; at: number }>;
  availableFrom: number;
  lastAt: number;
  publicationHigh: { price: number; at: number } | null;
  legacyBaseline?: { price: number; at: number } | null;
};
type GainState = LiveWatchlistSymbolState & { gainTracking?: GainTracking };
const positive = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n) && n > 0;

export function prepareGain(state: GainState): GainState {
  if (state.gainTracking || !state.firstPostedAt) return state;
  const at = state.publication?.postedAt ?? state.firstPostedAt;
  const price = state.publication?.price;
  const old = state.potentialGain;
  const peaks = old && positive(old.highPrice) && old.highPriceAt >= at
    ? [{ price: old.highPrice, at: old.highPriceAt }] : [];
  const publicationQuote = positive(price) ? { price, at } : null;
  const publicationHigh = peaks[0] && (!publicationQuote || peaks[0].price > publicationQuote.price) ? peaks[0] : publicationQuote;
  const legacyBaseline = !positive(price) && old && positive(old.startingPrice) && positive(old.startingPriceAt)
    ? {price: old.startingPrice, at: old.startingPriceAt} : null;
  const gainTracking: GainTracking = { version: 1, revision: 0, override: null, peaks,
    availableFrom: peaks[0]?.at ?? at, lastAt: peaks[0]?.at ?? at, publicationHigh, legacyBaseline };
  const base = positive(price) ? { postedAt: at, startingPrice: price, startingPriceAt: at,
    highPrice: price, highPriceAt: at, potentialGainPct: 0 } : null;
  return recalculateGain({ ...state, gainTracking, potentialGain: base });
}

function recalculateGain(state: GainState): GainState {
  const track = state.gainTracking;
  if (!track) return state;
  const start = track.override ?? (positive(state.publication?.price)
    ? { price: state.publication!.price!, at: state.publication!.postedAt } : track.legacyBaseline ?? null);
  if (!start) return { ...state, potentialGain: null };
  let high = { price: start.price, at: start.at };
  // The real publication quote remains evidence even after an owner chooses
  // another baseline. The owner's price itself is never added to observations.
  if (positive(state.publication?.price) && state.publication!.postedAt >= start.at && state.publication!.price! > high.price)
    high = {price: state.publication!.price!, at: state.publication!.postedAt};
  if (track.publicationHigh && track.publicationHigh.at >= start.at && track.publicationHigh.price > high.price) high = track.publicationHigh;
  for (const p of track.peaks) if (p.at >= start.at && p.price > high.price) high = p;
  const potentialGain: LiveWatchlistPotentialGain = { postedAt: start.at,
    startingPrice: start.price, startingPriceAt: start.at, highPrice: high.price,
    highPriceAt: high.at, potentialGainPct: (high.price / start.price - 1) * 100 };
  return { ...state, potentialGain };
}

export function observeGain(state: GainState, price: number | null, at: number): GainState {
  const ready = prepareGain(state), track = ready.gainTracking;
  if (!track || !positive(price) || !Number.isFinite(at) || at < track.lastAt || at < (state.firstPostedAt ?? 0)) return ready;
  const peaks = track.peaks.slice();
  while (peaks.length && peaks[peaks.length - 1].price <= price) peaks.pop();
  peaks.push({ price, at });
  // Bound a pathological descending sequence; report the retained coverage.
  const removed = peaks.length > 4096 ? peaks.splice(0, peaks.length - 4096) : [];
  const next = recalculateGain({ ...ready, gainTracking: { ...track, peaks, lastAt: at,
    publicationHigh: !track.publicationHigh || price > track.publicationHigh.price ? {price, at} : track.publicationHigh,
    availableFrom: removed.length ? peaks[0].at : track.availableFrom } });
  // Normal streaming never forgets an already observed high when compacting.
  if (ready.potentialGain && next.potentialGain && ready.potentialGain.highPrice > next.potentialGain.highPrice)
    next.potentialGain = ready.potentialGain;
  return next;
}

export function changeGainStart(state: GainState, input: { publicationAt: number; revision: number;
  reset?: boolean; price?: number; at?: number }, now = Date.now()): GainState {
  if (state.status === 'deactivated' || !state.firstPostedAt || state.firstPostedAt !== input.publicationAt)
    throw new Error('This listing changed. Close and reopen Gain starting point.');
  const ready = prepareGain(state), track = ready.gainTracking!;
  if (input.revision !== track.revision) throw new Error('The starting point changed. Close and reopen to see it.');
  if (input.reset) {
    if (!positive(state.publication?.price)) throw new Error('No original publication price was saved. Enter a starting price and time.');
  } else if (!positive(input.price) || !positive(input.at) || !Number.isSafeInteger(input.at) || input.at > now || input.at > 8640000000000000) {
    throw new Error('Enter a positive price and a valid starting time that is not in the future.');
  }
  return recalculateGain({ ...ready, gainTracking: { ...track, revision: track.revision + 1,
    override: input.reset ? null : { price: input.price!, at: input.at! } } });
}

export function gainStartingPointView(state: GainState) {
  const ready = prepareGain(state);
  return { symbol: state.symbol, publicationAt: state.firstPostedAt, publication: state.publication,
    revision: ready.gainTracking?.revision ?? 0, custom: !!ready.gainTracking?.override,
    price: ready.potentialGain?.startingPrice ?? null, at: ready.potentialGain?.postedAt ?? state.firstPostedAt,
    availableFrom: ready.gainTracking?.availableFrom ?? null, gain: ready.potentialGain };
}

/** Immutable publication/market facts for recap consumers, never owner gain overrides. */
export function gainPublicationEvidence(state: GainState) {
  const ready = prepareGain(state);
  const price = positive(state.publication?.price) ? state.publication!.price!
    : ready.gainTracking?.legacyBaseline?.price ?? null;
  const high = ready.gainTracking?.publicationHigh;
  return price === null && !high ? null : {
    startingPrice: price,
    highPrice: high?.price ?? null,
    highPriceAt: high?.at ?? null,
  };
}
