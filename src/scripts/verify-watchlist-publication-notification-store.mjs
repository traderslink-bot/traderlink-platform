import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(process.env.TRADERLINK_FOCUSED_DEPENDENCY_PACKAGE || new URL('../../package.json', import.meta.url));
const ts = require('typescript');
const Database = require('better-sqlite3');
function moduleUrl(relativePath, replacements = []) {
  let source = readFileSync(new URL(relativePath, import.meta.url), 'utf8');
  for (const [from, to] of replacements) source = source.replace(from, to);
  return `data:text/javascript;base64,${Buffer.from(ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText).toString('base64')}`;
}
const contract = moduleUrl('../modules/watchlist/server/notifications/watchlist-publication-notification-contract.ts');
const { WatchlistPublicationNotificationStore: Store } = await import(moduleUrl(
  '../modules/watchlist/server/notifications/watchlist-publication-notification-store.ts',
  [['"./watchlist-publication-notification-contract"', JSON.stringify(contract)]],
));
const { platformWatchlistPublicationNotificationsMigration: migration } = await import(moduleUrl(
  '../modules/platform/server/database/migrations/0137_platform_watchlist_publication_notifications.ts',
));
const db = new Database(':memory:');
try {
  db.pragma('foreign_keys=ON');
  db.exec('CREATE TABLE platform_users(user_id TEXT PRIMARY KEY) STRICT;');
  for (const sql of migration.statements) db.exec(sql);
  const { platformWatchlistNotificationActionIdentityMigration: actions } = await import(moduleUrl(
    '../modules/platform/server/database/migrations/0138_platform_watchlist_notification_action_identity.ts'));
  // Rehearse the exact predecessor with existing receipts, independently of the new store.
  const predecessor = new Database(':memory:');
  try {
    predecessor.pragma('foreign_keys=ON');
    predecessor.exec("CREATE TABLE platform_users(user_id TEXT PRIMARY KEY) STRICT; INSERT INTO platform_users VALUES('owner');");
    for (const sql of migration.statements) predecessor.exec(sql);
    predecessor.exec(`INSERT INTO platform_watchlist_notification_preferences VALUES('owner',1,1,'2026-09-15T13:00:00.000Z');
      INSERT INTO platform_watchlist_notification_intents VALUES('cycle','YFOR',1,1,'owner','[]','2026-09-15T13:00:00.000Z','2026-09-15T13:00:00.000Z','accepted');
      INSERT INTO platform_watchlist_notification_events VALUES('cycle','YFOR','2026-09-15T13:00:00.000Z','2026-09-15T13:00:00.000Z','2026-09-15T13:00:00.000Z','2026-09-15T14:00:00.000Z');
      INSERT INTO platform_watchlist_notification_deliveries VALUES('receipt','cycle','owner','email','target','delivered',1,'2026-09-15T13:00:00.000Z','2026-09-15T13:00:00.000Z','2026-09-15T13:00:00.000Z',NULL);`);
    for (const sql of actions.statements) predecessor.exec(sql);
    assert.deepEqual(predecessor.pragma('foreign_key_check'), []);
    assert.equal(predecessor.prepare('SELECT event_id FROM platform_watchlist_notification_deliveries').get().event_id,'cycle');
    assert.equal(predecessor.prepare('SELECT state FROM platform_watchlist_notification_deliveries').get().state,'delivered');
    assert.equal(predecessor.prepare('SELECT cycle_id FROM platform_watchlist_notification_events').get().cycle_id,'cycle');
    assert.equal(predecessor.prepare('SELECT web_push_enabled FROM platform_watchlist_notification_preferences').get().web_push_enabled,1);
    assert.equal(predecessor.prepare('SELECT state FROM platform_watchlist_notification_intents').get().state,'accepted');
    assert.throws(() => predecessor.exec("UPDATE platform_watchlist_notification_events SET ticker='OTHER'"));
  } finally { predecessor.close(); }
  for (const sql of actions.statements) db.exec(sql);
  const userId = '10000000-0000-4000-8000-000000000001';
  const targetRef = '20000000-0000-4000-8000-000000000002';
  db.prepare('INSERT INTO platform_users VALUES(?)').run(userId);
  const store = new Store(db);
  const now = new Date('2026-09-15T13:25:01.000Z');
  const event = { version: 1, cycleId: '30000000-0000-4000-8000-000000000003',
    ticker: 'YFOR', approvedAtUtc: '2026-09-15T13:25:00.000Z', publishedAtUtc: now.toISOString() };
  assert.deepEqual(store.readPreferences(userId), { webPushEnabled: false, emailEnabled: false });
  store.savePreference(userId, 'web_push', true, now);
  store.savePreference(userId, 'email', true, now);
  store.savePreference(userId, 'web_push', false, now);
  assert.deepEqual(store.readPreferences(userId), { webPushEnabled: false, emailEnabled: true });
  const recipient = { userId, targetRef, channel: 'email' };
  assert.deepEqual(store.accept({ event, now, recipients: () => [recipient, recipient,
    { ...recipient, channel: 'web_push' }] }), { duplicate: false, enqueued: 1 });
  let consultedAgain = false;
  assert.deepEqual(store.accept({ event, now, recipients: () => { consultedAgain = true; return [recipient]; } }),
    { duplicate: true, enqueued: 0 });
  assert.equal(consultedAgain, false);
  assert.throws(() => store.accept({ event: { ...event, ticker: 'SOAR' }, now, recipients: () => [] }));
  const second = { ...event, cycleId: '40000000-0000-4000-8000-000000000004' };
  assert.throws(() => store.accept({ event: second, now, recipients: () => [recipient, { ...recipient, targetRef: 'bad' }] }));
  assert.equal(db.prepare('SELECT count(*) n FROM platform_watchlist_notification_events').get().n, 1);
  assert.equal(db.prepare('SELECT count(*) n FROM platform_watchlist_notification_deliveries').get().n, 1);
  assert.deepEqual(store.accept({ event: second, now, recipients: () => [recipient] }), { duplicate: false, enqueued: 1 });
  const old = { ...event, cycleId: '50000000-0000-4000-8000-000000000005' };
  assert.deepEqual(store.accept({ event: old, now: new Date(now.getTime() + 3_600_000),
    recipients: () => { throw new Error('Expired events must not select recipients'); } }),
    { duplicate: false, enqueued: 0 });
  assert.deepEqual(db.pragma('foreign_key_check'), []);
  assert.throws(() => db.prepare('UPDATE platform_watchlist_notification_events SET ticker=?').run('SOAR'));
  assert.throws(() => store.savePreference(userId, 'discord_dm', true, now));
  console.log('PASS: default-off independent consent, atomic fan-out rollback, duplicate/replay identity, expiry, new cycles, foreign keys and immutable event evidence. In-memory only; no network.');
} finally { db.close(); }
