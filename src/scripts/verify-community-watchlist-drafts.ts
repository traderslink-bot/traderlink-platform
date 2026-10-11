import assert from "node:assert/strict";
import Database from "better-sqlite3";
import { CommunityWatchlistRepository } from "../modules/community/server/community-watchlist-repository";
import { platformIdentityMigration } from "../modules/platform/server/database/migrations/0001_platform_identity";
import { communityWatchlistsMigration } from "../modules/community/server/database/migrations/0076_community_watchlists";

/** Remote disposable real-schema fixture only. Both users must have community.access. */
export function verifyCommunityWatchlistDrafts(database: Database.Database, ownerId: string, otherId: string) {
  const repository = new CommunityWatchlistRepository(database);
  const at = "2026-10-11T12:00:00.000Z";
  const later = "2026-10-11T12:01:00.000Z";
  const publishedAt = "2026-10-11T12:02:00.000Z";
  database.exec("SAVEPOINT community_draft_qa");
  try {
    const initial = repository.create({ userId: ownerId, timestamp: at, watchlist: {
      title: "Draft lifecycle QA", description: "Original draft", tags: ["QA"], profileTags: ["QA"],
      tickers: [{ symbol: "AAPL", whyWatching: "Independent research", plan: "Original plan" }],
      publish: false, sendDiscord: false,
    } });
    const summary = repository.listMine(ownerId).find(item => item.href === initial.detailHref);
    assert.ok(summary?.draftId);
    const draftId = summary.draftId;
    const draft = repository.findOwnedDraft(ownerId, draftId);
    assert.ok(draft);
    assert.equal(draft.watchlist.title, "Draft lifecycle QA");
    assert.equal(draft.watchlist.tickers[0].whyWatching, "Independent research");
    assert.equal(draft.watchlist.sendDiscord, false);
    assert.equal(repository.findOwnedDraft(otherId, draftId), null);
    assert.equal(repository.findOwnedDraft(ownerId, "invalid"), null);
    const [, , handle, , slug] = initial.detailHref.split("/");
    assert.equal(repository.findPublished(handle, slug), null);
    const updated = { ...draft.watchlist, description: "Updated draft", tickers: [{ symbol: "MSFT", plan: "Revised plan" }], publish: false, sendDiscord: false };
    assert.throws(() => repository.create({ userId: otherId, timestamp: later, watchlist: updated, draft: { id: draftId, updatedAtUtc: at } }));
    const saved = repository.create({ userId: ownerId, timestamp: later, watchlist: updated, draft: { id: draftId, updatedAtUtc: at } });
    assert.equal(saved.detailHref, initial.detailHref);
    assert.equal(saved.publicationId, null);
    assert.equal(repository.findOwnedDraft(ownerId, draftId)?.watchlist.tickers[0].symbol, "MSFT");
    assert.equal(repository.findOwnedDraft(ownerId, draftId)?.watchlist.description, "Updated draft");
    assert.throws(() => repository.create({ userId: ownerId, timestamp: publishedAt, watchlist: updated, draft: { id: draftId, updatedAtUtc: at } }));
    assert.equal(repository.findOwnedDraft(ownerId, draftId)?.watchlist.description, "Updated draft");
    const published = repository.create({ userId: ownerId, timestamp: publishedAt, watchlist: { ...updated, publish: true }, draft: { id: draftId, updatedAtUtc: later } });
    assert.equal(published.detailHref, initial.detailHref);
    assert.ok(published.publicationId);
    assert.equal(repository.findOwnedDraft(ownerId, draftId), null);
    assert.equal(repository.listMine(ownerId).find(item => item.href === initial.detailHref)?.draftId, undefined);
    assert.equal(repository.findPublished(handle, slug)?.tickers[0].plan, "Revised plan");
    assert.throws(() => repository.create({ userId: ownerId, timestamp: publishedAt, watchlist: updated, draft: { id: draftId, updatedAtUtc: publishedAt } }));
    const publications = database.prepare("SELECT discord_requested,discord_state FROM community_watchlist_publications WHERE watchlist_id=?").all(draftId);
    assert.deepEqual(publications, [{ discord_requested: 0, discord_state: "not_requested" }]);
    assert.deepEqual(database.pragma("foreign_key_check"), []);
  } finally {
    database.exec("ROLLBACK TO community_draft_qa; RELEASE community_draft_qa");
  }
}

if (process.argv[1]?.replaceAll("\\", "/").endsWith("/verify-community-watchlist-drafts.ts")) {
  const database = new Database(":memory:");
  try {
    database.pragma("foreign_keys=ON");
    for (const migration of [platformIdentityMigration, communityWatchlistsMigration]) {
      for (const statement of migration.statements) database.exec(statement);
    }
    const ownerId = "10000000-0000-4000-8000-000000000001";
    const otherId = "10000000-0000-4000-8000-000000000002";
    for (const [id, subject] of [[ownerId, "draft-owner"], [otherId, "draft-other"]]) {
      database.prepare("INSERT INTO platform_users(user_id,auth_provider,auth_subject,display_name,status,created_at_utc,updated_at_utc) VALUES(?,'discord',?,'Draft QA','active',?,?)")
        .run(id, subject, "2026-10-11T12:00:00.000Z", "2026-10-11T12:00:00.000Z");
    }
    // Commercial enforcement is absent in this bounded schema; ownership is real.
    verifyCommunityWatchlistDrafts(database, ownerId, otherId);
    console.log("PASS: community draft persistence, isolation, stale-save rejection and no-notification publication");
  } finally { database.close(); }
}
