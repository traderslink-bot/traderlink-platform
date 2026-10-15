// Actual exported action functions + actual service/database. Only request identity,
// database acquisition and Next cache/navigation APIs are isolated from the host.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function createReviewActionHarness({database, actor, Service, atUtc, relationshipId}) {
  const effects = [];
  const exports = {};
  const source = fs.readFileSync(path.resolve(__dirname, '../../app/(dashboard)/communities/community-actions.ts'), 'utf8');
  const code = ts.transpileModule(source, {compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
  }}).outputText;
  vm.runInNewContext(code, {exports, FormData, Date, require(id) {
    if (id === 'next/cache') return {
      refresh: () => effects.push('refresh'), revalidatePath: value => effects.push(value),
    };
    if (id === 'next/navigation') return {
      redirect() { throw Error('Unexpected redirect'); }, unstable_rethrow(error) { throw error; },
    };
    if (id.endsWith('/require-platform-request-scope')) return {
      requireTraderLinkPlatformPageIdentity: async () => ({scope: {userId: actor.userId}}),
    };
    if (id.endsWith('/community-request-access')) return {requireCommunityRequestAccess: async input => {
      assert.equal(input.userId, actor.userId);
      assert.equal(input.slug, 'first-room');
      assert.equal(input.relationshipId, relationshipId);
      assert.equal(input.verifyParticipants, true);
      assert.equal(input.existingCoachingOnly, true);
    }};
    if (id.endsWith('/open-platform-database')) return {withPlatformDatabase: (options, run) => {
      assert.equal(options.mode, 'runtime'); return run(database);
    }};
    if (id.endsWith('/platform-migration-contract')) return {createCanonicalUtcTimestamp: () => atUtc};
    if (id.endsWith('/traderlink-community-viewer')) return {resolveTraderLinkCommunityViewer: () => actor};
    if (id.endsWith('/traderlink-community-coaching-program-service')) return {TraderLinkCommunityCoachingProgramService: Service};
    // These imports are not used by the reviewed actions. Calling an unexpected
    // external capability fails rather than performing network/hosted activity.
    return {};
  }}, {filename: 'actual-community-actions.acceptance.js'});
  function form(reviewId, fields = {}) {
    const data = new FormData();
    for (const [key, value] of Object.entries({communitySlug: 'first-room', relationshipId, reviewId, ...fields})) data.set(key, value);
    return data;
  }
  function offline(action) {
    return async data => {
      const previousFetch = globalThis.fetch;
      globalThis.fetch = () => { effects.push('unexpected-network-attempt'); throw Error('Network disabled in isolated action acceptance'); };
      try { return await action(data); }
      finally { globalThis.fetch = previousFetch; }
    };
  }
  return {effects, form,
    deliver: offline(exports.deliverCommunityReviewAction),
    lifecycle: offline(exports.setCommunityReviewLifecycleAction),
    select: offline(exports.selectCommunityReviewTradesAction),
    saveTrade: offline(exports.saveCommunityReviewTradeAction),
    remove: offline(exports.removeCommunityReviewTradesAction),
  };
}

function reviewActionState(database, reviewId) {
  // Only disposable synthetic fixture rows are inspected here.
  const sideEffectTables = database.prepare("SELECT name FROM sqlite_master WHERE type='table' AND (name LIKE '%outbox%' OR name LIKE '%notice%' OR name LIKE '%notification%' OR name LIKE '%deliver%') ORDER BY name").all();
  return {
    review: database.prepare('SELECT * FROM traderlink_community_coaching_trade_reviews WHERE review_id=?').get(reviewId),
    trades: database.prepare('SELECT * FROM traderlink_community_coaching_review_trades WHERE review_id=? ORDER BY ordinal').all(reviewId),
    events: database.prepare('SELECT * FROM traderlink_community_coaching_review_events WHERE review_id=? ORDER BY event_id').all(reviewId),
    sideEffectCounts: Object.fromEntries(sideEffectTables.map(({name}) => {
      assert.match(name, /^[a-z0-9_]+$/);
      return [name, database.prepare(`SELECT count(*) count FROM ${name}`).get().count];
    })),
  };
}

async function withSyntheticJournalFacts(JournalReader, trade, run) {
  const originalRead = JournalReader.prototype.read;
  const originalReadTrade = JournalReader.prototype.readTrade;
  // Replace only the Journal fact source. Keep the real relationship, owner,
  // account and explicit sharing checks that the reader performs in grant().
  function permit(reader, input) {
    const {grant} = reader.grant(input);
    assert.ok(['trades', 'complete'].includes(grant.data_scope));
  }
  JournalReader.prototype.read = function(input) { permit(this, input); return {trades: [trade]}; };
  JournalReader.prototype.readTrade = function(input) {
    permit(this, input); assert.equal(input.roundTripId, trade.roundTripId);
    return {trade, story: {executions: [], notes: null, ruleReviews: [], tags: []}};
  };
  try { return await run(); }
  finally {
    JournalReader.prototype.read = originalRead;
    JournalReader.prototype.readTrade = originalReadTrade;
  }
}

module.exports = {createReviewActionHarness, reviewActionState, withSyntheticJournalFacts};
