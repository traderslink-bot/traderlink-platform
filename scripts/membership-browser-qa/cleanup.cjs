// Explicitly scoped disposable fixtures only; preserve immutable QA history.
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const root = process.cwd();
const fixturePath = process.env.MEMBERSHIP_QA_FIXTURE;
const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
assert(fixture.dir.startsWith('/workspaces/private-data/membership-qa-fixtures/run-'));
assert.equal(path.dirname(fixturePath), fixture.dir);
assert.equal(fixture.env.TRADERLINK_PLATFORM_DB_PATH, path.join(fixture.dir, 'qa.sqlite'));
const requireApp = require('node:module').createRequire(path.join(root, 'package.json'));
const Module = require('node:module'), originalLoad = Module._load;
Module._load = function (id, ...args) { return id === 'server-only' ? {} : originalLoad.call(this, id, ...args); };
requireApp('tsx/cjs');
const src = id => requireApp('./src/' + id);
const { archiveMembershipPlan } = src('modules/platform/server/membership/membership-plan-editor-archive.ts');
const { MembershipPlanEditorDrafts } = src('modules/platform/server/membership/membership-plan-editor-drafts.ts');
const { PlatformMembershipManagement } = src('modules/platform/server/membership/platform-membership-management.ts');
const { PlatformSessionService } = src('modules/platform/server/authentication/platform-session-service.ts');
const { PlatformSessionRepository } = src('modules/platform/server/authentication/platform-session-repository.ts');
const db = new (requireApp('better-sqlite3'))(fixture.env.TRADERLINK_PLATFORM_DB_PATH);
db.pragma('foreign_keys=ON');
try {
  const expected = Object.values(fixture.users).map(user => user.userId).sort();
  assert.deepEqual(db.prepare('SELECT user_id FROM platform_users ORDER BY user_id').all().map(row => row.user_id), expected,
    'Refuse cleanup if any unrecorded user exists');
  const actor = fixture.users.owner.userId, at = new Date().toISOString();
  const management = new PlatformMembershipManagement(db);
  const perform = (operation, key, value) => {
    const form = new FormData(); form.set('operation', operation); form.set(key, value);
    management.execute(actor, form, at);
  };
  db.transaction(() => {
    for (const row of db.prepare("SELECT draft_id,revision FROM platform_membership_editor_drafts WHERE status='editing'").all())
      new MembershipPlanEditorDrafts(db).discard(actor, row.draft_id, row.revision, at);
    for (const row of db.prepare("SELECT DISTINCT p.plan_id FROM platform_membership_plans p JOIN platform_membership_plan_versions v USING(plan_id) WHERE v.lifecycle_state='published' AND p.status<>'retired'").all())
      archiveMembershipPlan(db, actor, row.plan_id, at);
    for (const row of db.prepare("SELECT share_link_id FROM platform_membership_share_links WHERE status IN ('active','paused')").all())
      perform('revoke_link', 'shareLinkId', row.share_link_id);
    for (const row of db.prepare("SELECT entitlement_id FROM platform_membership_entitlements WHERE status NOT IN ('revoked','expired')").all())
      perform('revoke_grant', 'entitlementId', row.entitlement_id);
    const sessions = new PlatformSessionService(new PlatformSessionRepository(db));
    for (const user of Object.values(fixture.users)) sessions.revokeAllForUser(user.userId);
  })();
  assert.equal(db.prepare("SELECT count(*) n FROM platform_membership_offers WHERE status='active'").get().n, 0);
  assert.equal(db.prepare("SELECT count(*) n FROM platform_membership_share_links WHERE status='active'").get().n, 0);
  assert.equal(db.prepare("SELECT count(*) n FROM platform_membership_entitlements WHERE status='active'").get().n, 0);
  assert.equal(db.prepare('SELECT count(*) n FROM platform_auth_sessions WHERE revoked_at_utc IS NULL AND expires_at_utc>?').get(at).n, 0);
  for (const table of ['platform_notification_remote_deliveries', 'platform_watchlist_notification_deliveries',
    'platform_watchlist_category_move_deliveries', 'platform_watchlist_owner_review_deliveries']) {
    assert.equal(db.prepare(`SELECT count(*) n FROM ${table}`).get().n, 0, `Unexpected synthetic external delivery: ${table}`);
  }
  assert.equal(db.pragma('foreign_key_check').length, 0);
  fs.mkdirSync(path.join(fixture.dir, 'evidence'), { recursive: true });
  fs.writeFileSync(path.join(fixture.dir, 'evidence', 'cleanup.json'), JSON.stringify({ status: 'PASS', at,
    archivedPlans: true, discardedDrafts: true, revokedLinksAndGrants: true, endedSessions: true,
    immutableAuditVersionsTrialAndUsageHistoryPreserved: true }, null, 2));
  console.log('PASS synthetic cleanup; immutable history preserved');
} finally { db.close(); }
