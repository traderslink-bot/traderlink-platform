import assert from 'node:assert/strict';
import {
  parseWatchlistPublicationNotificationEvent as parse,
  watchlistNotificationExpired as expired,
  watchlistPublicationNotificationCopy as copy,
  WATCHLIST_NOTIFICATION_MAX_AGE_MS,
  publicationFromReview,
} from '../modules/watchlist/server/notifications/watchlist-publication-notification-contract.ts';

const event = { version: 1, cycleId: '10000000-0000-4000-8000-000000000001',
  ticker: 'YFOR', approvedAtUtc: '2026-09-15T13:25:00.000Z', publishedAtUtc: '2026-09-15T13:25:01.000Z' };
const now = Date.parse(event.publishedAtUtc);
assert.deepEqual(parse(event, now), event);
assert.ok(Object.isFrozen(parse(event, now)));
for (const invalid of [null, [], {}, { ...event, version: 2 },
  { ...event, cycleId: 'not-a-cycle' }, { ...event, ticker: '../admin' },
  { ...event, ticker: '<img>' }, { ...event, ticker: 'YFOR?recipient=someone' },
  { ...event, ticker: 'yfor' }, { ...event, image: 'unapproved' },
  { ...event, approvedAtUtc: '2026-02-30T13:25:00.000Z' },
  { ...event, approvedAtUtc: '2026-09-15T13:25:02.000Z' },
  { ...event, publishedAtUtc: '2026-09-15T13:27:00.000Z' },
  { ...event, approvedAtUtc: '2026-09-15T13:25:00Z' }]) {
  assert.equal(parse(invalid, now), null);
}
assert.equal(parse(event, NaN), null);
assert.equal(expired(event, now + WATCHLIST_NOTIFICATION_MAX_AGE_MS - 1), false);
assert.equal(expired(event, now + WATCHLIST_NOTIFICATION_MAX_AGE_MS), true);
assert.deepEqual(parse(event, now + 86_400_000), event);
assert.equal(expired(event, now + 86_400_000), true);
assert.equal(copy('YFOR').pushTitle, 'YFOR added to the Watchlist');
assert.equal(copy('YFOR').destinationPath, '/watchlist/YFOR');
assert.equal(copy('YFOR').emailWatchlistPath, '/watchlist');
assert.equal(copy('YFOR').emailTitle, 'YFOR added to the TradersLink Watchlist');
assert.equal(copy('BRK.B').destinationPath, '/watchlist/BRK.B');
assert.throws(() => copy('//external.example'));
const intent = { cycleId: event.cycleId, ticker: 'YFOR', expectedHead: 2, draftRevision: 2, actor: 'platform-owner:test' };
const approval = { revision: 3, actor: intent.actor, at: now-1000, body: { kind: 'approve', draftRevision: 2 } };
const receipt = { revision: 4, at: now, body: { kind: 'delivery', channel: 'website', status: 'acknowledged', approvalRevision: 3 } };
const review = { cycleId: event.cycleId, symbol: 'YFOR', cancelled: false, events: [approval,receipt] };
assert.deepEqual(publicationFromReview(intent,review,now),event);
for (const rejected of [{ ...review, cancelled: true },{ ...review, symbol: 'SOAR' },
  { ...review, events:[approval] },{ ...review, events:[{...approval,actor:'someone-else'},receipt] },
  { ...review, events:[{...approval,body:{kind:'approve',draftRevision:1}},receipt] },
  { ...review, events:[approval,{...receipt,body:{...receipt.body,channel:'discord'}}] },
  { ...review, events:[approval,{...receipt,body:{...receipt.body,approvalRevision:2}}] }]) {
  assert.equal(publicationFromReview(intent,rejected,now),null);
}
assert.equal(publicationFromReview({...intent,expectedHead:3},review,now),null);
console.log('PASS: Watchlist publication event validation, expiry and approved notification copy. No network or database access.');
