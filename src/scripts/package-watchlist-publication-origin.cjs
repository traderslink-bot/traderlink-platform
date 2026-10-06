const cp = require('node:child_process');
const assert = require('node:assert/strict');
const runtime = 'C:/Users/jerac/Documents/TraderLink/levels-system-post-mtf-handoff-stability';
const parents = { runtime: '0404560efca8aac3e199e82dd6e1f45a02bd4f75', platform: 'bb4b4c65dd5e183a2a04041aea541e5d91afffb3' };
function base(lane, file) { return cp.execFileSync('git', [...(lane === 'runtime' ? ['-c', `safe.directory=${runtime}`, '-C', runtime] : []), 'show', `${parents[lane]}:${file}`], { encoding: 'utf8', maxBuffer: 20e6 }); }
function one(s, from, to) { assert.equal(s.split(from).length, 2, from); return s.replace(from, to); }
function prepare(lane) {
  const files = new Map();
  const types = 'src/lib/live-watchlist/live-watchlist-types.ts';
  let s = base(lane, types);
  s = one(s, '  firstPostedAt?: number | null;', '  firstPostedAt?: number | null;\n  /** Present only on a first public listing, never on an analysis refresh. */\n  publicationPrice?: number | null;');
  if (lane === 'platform') s = one(s, '  firstPostedAt: number | null;\n  watchlistGroup?', '  firstPostedAt: number | null;\n  publication?: { postedAt: number; price: number | null };\n  watchlistGroup?');
  files.set(types, s);
  if (lane === 'runtime') {
    const f = 'src/lib/monitoring/manual-watchlist-runtime-manager.ts'; s = base(lane, f);
    s = one(s, '  private buildTraderNotesCard(', `  private publicationPrice(symbol: string): number | null {
    const price = this.watchlistStore.getEntry(symbol)?.lastPrice;
    return typeof price === "number" && Number.isFinite(price) && price > 0 ? price : null;
  }

  private buildTraderNotesCard(`);
    s = one(s, '...(!alreadyListed ? { firstPostedAt: this.options.now?.() ?? Date.now() } : {}),', '...(!alreadyListed ? { firstPostedAt: this.options.now?.() ?? Date.now(), publicationPrice: this.publicationPrice(symbol) } : {}),');
    s = one(s, 'if (!alreadyListed) snapshot.firstPostedAt = this.options.now?.() ?? Date.now();', 'if (!alreadyListed) {\n      snapshot.firstPostedAt = this.options.now?.() ?? Date.now();\n      snapshot.publicationPrice = this.publicationPrice(symbol);\n    }');
    s = one(s, 'firstPostedAt: this.watchlistStore.getEntry(symbol)?.activatedAt ?? timestamp,', 'firstPostedAt: timestamp,\n      publicationPrice: this.publicationPrice(symbol),');
    files.set(f, s);
  } else {
    const f = 'src/lib/live-watchlist/live-watchlist-store.ts'; s = base(lane, f);
    s = one(s, '  const nextFirstPostedAt = patchesFirstPostedAt\n    ? normalizeLiveWatchlistTimestamp(patch.firstPostedAt)\n    : baseExisting?.firstPostedAt ?? (cardTimes.length > 0 ? Math.min(...cardTimes) : null);', `  // Capture when this listing first reaches the public store, not draft creation
  // or approval time. Replay, refresh, moves and startup snapshots cannot reset it.
  const startsPublication = Object.prototype.hasOwnProperty.call(patch, "publicationPrice") && !baseExisting?.firstPostedAt;
  const publication = baseExisting?.publication ?? (startsPublication ? {
    postedAt: Date.now(),
    price: typeof patch.publicationPrice === "number" && Number.isFinite(patch.publicationPrice) && patch.publicationPrice > 0 ? patch.publicationPrice : null,
  } : undefined);
  const nextFirstPostedAt = publication?.postedAt ?? baseExisting?.firstPostedAt ?? (patchesFirstPostedAt
    ? normalizeLiveWatchlistTimestamp(patch.firstPostedAt)
    : cardTimes.length > 0 ? Math.min(...cardTimes) : null);`);
    s = one(s, '    firstPostedAt: nextFirstPostedAt,', '    firstPostedAt: nextFirstPostedAt,\n    publication,');
    s = one(s, '    firstPostedAt: existing?.firstPostedAt ?? null,', '    firstPostedAt: existing?.firstPostedAt ?? null,\n    publication: existing?.publication,');
    s = one(s, '    firstPostedAt: existing.firstPostedAt ?? archived.firstPostedAt,', '    firstPostedAt: existing.firstPostedAt ?? archived.firstPostedAt,\n    publication: existing.publication ?? archived.publication,');
    files.set(f, s);
    const card = 'app/watchlist/live-watchlist-client.tsx'; s = base(lane, card);
    s = one(s, '{symbol.potentialGain?.postedAt === symbol.firstPostedAt &&\n          Number.isFinite(symbol.potentialGain?.startingPrice) &&\n          (symbol.potentialGain?.startingPrice ?? 0) > 0 ? (\n            <span>Posted at ${formatPrice(symbol.potentialGain!.startingPrice)}</span>', '{typeof symbol.publication?.price === "number" && symbol.publication.price > 0 ? (\n            <span>Posted at ${formatPrice(symbol.publication.price)}</span>');
    files.set(card, s);
    const help = 'src/modules/help/watchlist-guides.ts'; s = base(lane, help);
    const anchor = 'Analysis card: Shown/Hidden controls the whole analysis for one ticker.';
    s = one(s, anchor, 'The listing Added time and ticker header Posted time record first publication to members, not addition to admin. Posted price is the latest available quote saved for that publication, not the analysis reference price. Later analysis updates and list moves preserve this original record. ' + anchor);
    files.set(help,s);
    const plan = 'docs/migration/watchlist-runtime-dashboard-admin-plan.md';
    files.set(plan, base(lane, plan) + '\n\nPublication price/time correction: [progress](watchlist-publication-origin-progress.md).\n');
  }
  return files;
}
module.exports = { prepare, parents, runtime };
if (require.main === module) for (const lane of ['runtime', 'platform']) console.log(lane, [...prepare(lane).keys()]);
