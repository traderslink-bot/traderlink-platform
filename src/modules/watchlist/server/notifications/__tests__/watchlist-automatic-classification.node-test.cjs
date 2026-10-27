const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const Database = require('better-sqlite3');
const root = path.resolve(__dirname, '../../../../../..');
const prefix = 'src/modules/watchlist/server/notifications/';
function load(file, ports = {}) {
  const exports = {};
  const output = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText;
  vm.runInNewContext(output, { exports, require: name => name === 'server-only' ? {} : ports[name] ?? require(name) });
  return exports;
}
const helper = load(prefix + 'watchlist-analysis-update-copy.ts');
const contract = load(prefix + 'watchlist-publication-notification-contract.ts', { './watchlist-analysis-update-copy': helper });
const cycleId = '10000000-0000-4000-8000-000000000001';
const now = new Date('2026-10-27T23:12:00.000Z');
function fromProjection(hasPreviousAnalysis) {
  // Wire identity/timing mirrors sanitized BRAI evidence; UUID/actor are test-only.
  const context = { automatic: true, hasPreviousAnalysis, firstAnalysisPrice: null, updatedAnalysisPrice: null,
    categoryMoveNote: 'Now on Overnight Watches.' };
  const review = { cycleId, symbol: 'BRAI', cancelled: false, events: [
    { revision: 16, actor: 'runtime:automatic-boundary', at: Date.parse('2026-10-27T23:11:04.893Z'),
      body: { kind: 'approve', draftRevision: 15, publication: { notificationKind: 'analysis', notifyUsers: true,
        analysisUpdateContext: context } } },
    { revision: 17, actor: 'delivery', at: Date.parse('2026-10-27T23:11:05.528Z'),
      body: { kind: 'delivery', channel: 'website', status: 'acknowledged', approvalRevision: 16 } },
  ] };
  return contract.publicationFromReview({ cycleId, ticker: 'BRAI', expectedHead: 15,
    draftRevision: 15, actor: 'runtime:automatic-boundary' }, review, now.getTime());
}

test('consumer keeps producer classification even though old analysis/cards are intentionally absent from the compact feed', () => {
  const event = fromProjection(true);
  assert.ok(event);
  assert.equal(event.analysisUpdateContext.hasPreviousAnalysis, true);
  assert.equal(event.analysisUpdateContext.categoryMoveNote, 'Now on Overnight Watches.');
  const copy = contract.watchlistPublicationNotificationCopy('BRAI', 'analysis', false, event.analysisUpdateContext);
  assert.equal(copy.pushTitle, 'BRAI Analysis updated — Auto updated by AI');
  assert.equal(copy.emailTitle, copy.pushTitle);
  assert.doesNotMatch(copy.pushBody + copy.emailBody, /The first analysis|\$\d|\d(?:\.\d+)?%/);
});

test('a truly first analysis after listing-only keeps its explicit first-analysis flag', () => {
  const event = fromProjection(false);
  assert.equal(event.analysisUpdateContext.hasPreviousAnalysis, false);
  const copy = contract.watchlistPublicationNotificationCopy('BRAI', 'analysis', true, event.analysisUpdateContext);
  assert.equal(copy.pushTitle, 'BRAI Analysis published by "This Guy"');
  assert.match(copy.pushBody, /The first analysis is now available/);
});

function setupStore(t) {
  const db = new Database(':memory:'); t.after(() => db.close());
  db.exec(`CREATE TABLE platform_watchlist_notification_events (
    event_id TEXT PRIMARY KEY,cycle_id TEXT,notification_kind TEXT,approval_revision INTEGER,notify_users INTEGER,
    ticker TEXT,approved_at_utc TEXT,published_at_utc TEXT,accepted_at_utc TEXT,expires_at_utc TEXT,
    owner_approved INTEGER,analysis_update_context_json TEXT);
    CREATE TABLE platform_watchlist_notification_preferences(user_id TEXT PRIMARY KEY,web_push_enabled INTEGER,email_enabled INTEGER);
    CREATE TABLE platform_watchlist_notification_deliveries(delivery_id TEXT PRIMARY KEY,event_id TEXT,user_id TEXT,
    channel TEXT,target_ref TEXT,state TEXT,attempt_count INTEGER,available_at_utc TEXT,UNIQUE(event_id,user_id,channel,target_ref));`);
  const userId = '20000000-0000-4000-8000-000000000002', targetRef = '30000000-0000-4000-8000-000000000003';
  db.prepare('INSERT INTO platform_watchlist_notification_preferences VALUES(?,1,1)').run(userId);
  const { WatchlistPublicationNotificationStore } = load(prefix + 'watchlist-publication-notification-store.ts', {
    './watchlist-publication-notification-contract': contract,
    '@/src/modules/platform/server/notifications/platform-notification-defaults': {
      notificationDefaultEnabled: () => 1, notificationPreferenceEnabled: (_db, value) => value === 1,
    },
    '@/src/modules/platform/server/membership/membership-notification-access': { canReceiveMembershipNotification: () => true },
    '../access/watchlist-plan-policy': { canNotifyWatchlistTicker: () => true },
  });
  return { db, store: new WatchlistPublicationNotificationStore(db), userId, targetRef };
}

test('repeated automatic polls/move retries do not duplicate or rewrite an accepted event or its recipient snapshot', t => {
  const { db, store, userId, targetRef } = setupStore(t), event = fromProjection(true);
  assert.equal(store.accept({ event, now, recipients: () => [{ userId, targetRef, channel: 'web_push' }] }).enqueued, 1);
  for (const hasPreviousAnalysis of [true, false, true]) {
    const repeated = { ...event, analysisUpdateContext: { ...event.analysisUpdateContext, hasPreviousAnalysis } };
    assert.equal(store.accept({ event: repeated, now, recipients: () => assert.fail('must not enroll again') }).duplicate, true);
  }
  assert.equal(db.prepare('SELECT count(*) n FROM platform_watchlist_notification_deliveries').get().n, 1);
  assert.equal(db.prepare('SELECT count(*) n FROM platform_watchlist_notification_events').get().n, 1);
  assert.equal(JSON.parse(db.prepare('SELECT analysis_update_context_json value FROM platform_watchlist_notification_events').get().value).hasPreviousAnalysis, true);
});

test('a fixed projection never replays or corrects a previously accepted historical alert; only a new eligible approval can enqueue', t => {
  const { db, store, userId, targetRef } = setupStore(t);
  const original = fromProjection(false);
  const recipients = () => [{ userId, targetRef, channel: 'web_push' }];
  assert.equal(store.accept({ event: original, now, recipients }).enqueued, 1);
  db.prepare("UPDATE platform_watchlist_notification_deliveries SET state='delivered'").run();
  const fixed = fromProjection(true);
  const retry = store.accept({ event: fixed, now, recipients: () => assert.fail('must not resend old event') });
  assert.equal(retry.duplicate, true);
  assert.equal(retry.enqueued, 0);
  assert.equal(JSON.parse(db.prepare('SELECT analysis_update_context_json value FROM platform_watchlist_notification_events').get().value).hasPreviousAnalysis, false);
  assert.equal(db.prepare("SELECT count(*) n FROM platform_watchlist_notification_deliveries WHERE state='pending'").get().n, 0);
  const later = { ...fixed, approvalRevision: 18,
    approvedAtUtc: '2026-10-27T23:11:55.000Z', publishedAtUtc: '2026-10-27T23:11:56.000Z' };
  assert.equal(store.accept({ event: later, now, recipients }).enqueued, 1);
  assert.equal(db.prepare("SELECT count(*) n FROM platform_watchlist_notification_deliveries WHERE state='pending'").get().n, 1);
  assert.equal(db.prepare('SELECT count(*) n FROM platform_watchlist_notification_events').get().n, 2);
});
