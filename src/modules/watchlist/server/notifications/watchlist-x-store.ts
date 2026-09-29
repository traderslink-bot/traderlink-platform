import "server-only";
import { createHash, randomBytes } from "node:crypto";
import type Database from "better-sqlite3";
import { xCaptionStatus } from "./watchlist-x-caption";
import type { FreeChatPublication } from "./watchlist-free-chat-delivery";

export const xPostingStatements = [
  `CREATE TABLE platform_watchlist_x_posts (
    post_key TEXT PRIMARY KEY, cycle_id TEXT NOT NULL, ticker TEXT NOT NULL,
    owner_user_id TEXT NOT NULL REFERENCES platform_users(user_id), draft_revision INTEGER,
    approval_revision INTEGER, caption TEXT NOT NULL, channel_id TEXT NOT NULL,
    state TEXT NOT NULL CHECK(state IN ('waiting','preparing','ready','sending','accepted','sent','failed','uncertain','cancelled')),
    status_message TEXT NOT NULL, buffer_post_id TEXT, requested_at_ms INTEGER NOT NULL,
    updated_at_ms INTEGER NOT NULL, next_attempt_at_ms INTEGER NOT NULL DEFAULT 0,
    sent_at_ms INTEGER, attempts INTEGER NOT NULL DEFAULT 0,
    UNIQUE(cycle_id,draft_revision), UNIQUE(cycle_id,approval_revision)
  ) STRICT;`,
  `CREATE TABLE platform_watchlist_x_images (
    token TEXT PRIMARY KEY, post_key TEXT NOT NULL REFERENCES platform_watchlist_x_posts(post_key),
    ordinal INTEGER NOT NULL, png BLOB NOT NULL, sha256 TEXT NOT NULL,
    UNIQUE(post_key,ordinal)
  ) STRICT;`,
  `CREATE INDEX platform_watchlist_x_pending ON platform_watchlist_x_posts(state,next_attempt_at_ms);`,
] as const;

export type XPost = { post_key: string; cycle_id: string; ticker: string; owner_user_id: string;
  draft_revision: number | null; approval_revision: number | null; caption: string; channel_id: string;
  state: string; status_message: string; buffer_post_id: string | null; requested_at_ms: number;
  updated_at_ms: number; next_attempt_at_ms: number; sent_at_ms: number | null; attempts: number };

export function enqueueX(db: Database.Database, input: {cycleId: string; symbol: string; owner: string;
  draftRevision?: number; approvalRevision?: number; caption: string; channelId: string}, now = Date.now()) {
  const caption = xCaptionStatus(input.caption);
  if (!caption.valid) throw Error("Shorten the X caption to 280 characters and remove unsupported characters.");
  if (!input.cycleId || input.cycleId.length > 200 || !/^[A-Z][A-Z0-9.-]{0,12}$/.test(input.symbol)
    || !input.channelId || !Number.isSafeInteger(input.draftRevision ?? input.approvalRevision)
    || (input.draftRevision ?? input.approvalRevision ?? 0) < 1) throw Error("Invalid X publication selection.");
  const key = `${input.cycleId}:${input.approvalRevision ? 'approval' : 'draft'}:${input.approvalRevision ?? input.draftRevision}`;
  db.prepare(`INSERT OR IGNORE INTO platform_watchlist_x_posts
    (post_key,cycle_id,ticker,owner_user_id,draft_revision,approval_revision,caption,channel_id,state,status_message,requested_at_ms,updated_at_ms)
    VALUES(?,?,?,?,?,?,?,?,'waiting','Waiting for the selected approved analysis.',?,?)`)
    .run(key,input.cycleId,input.symbol,input.owner,input.draftRevision ?? null,input.approvalRevision ?? null,caption.text,input.channelId,now,now);
  return key;
}

export function freezeXImages(db: Database.Database, post: XPost, publication: FreeChatPublication, now = Date.now()) {
  if (publication.symbol !== post.ticker || publication.cycleId !== post.cycle_id || publication.approvalRevision !== post.approval_revision
    || !Array.isArray(publication.images) || publication.images.length < 1 || publication.images.length > 4) throw Error("Approved images unavailable.");
  const images = publication.images.map(image => {
    if (typeof image.base64 !== 'string' || image.base64.length > 7 * 1024 * 1024) throw Error("Image exceeds X size limit.");
    const png = Buffer.from(image.base64,'base64');
    if (png.length < 33 || png.length > 5 * 1024 * 1024 || png.subarray(0,8).toString('hex') !== '89504e470d0a1a0a'
      || png.toString('ascii',12,16) !== 'IHDR' || png.readUInt32BE(16) < 1 || png.readUInt32BE(20) < 1
      || png.readUInt32BE(16) * png.readUInt32BE(20) > 25000000) throw Error("Invalid analysis image.");
    return png;
  });
  db.transaction(() => {
    const changed = db.prepare("UPDATE platform_watchlist_x_posts SET state='ready',status_message='Ready to send to Buffer.',updated_at_ms=? WHERE post_key=? AND state='preparing'").run(now,post.post_key).changes;
    if (!changed) throw Error("X preparation changed.");
    const insert = db.prepare("INSERT INTO platform_watchlist_x_images(token,post_key,ordinal,png,sha256) VALUES(?,?,?,?,?)");
    images.forEach((png,index) => insert.run(randomBytes(24).toString('hex'),post.post_key,index,png,createHash('sha256').update(png).digest('hex')));
  }).immediate();
}

export function setXState(db: Database.Database, key: string, state: string, message: string, now = Date.now(), next = 0) {
  db.prepare("UPDATE platform_watchlist_x_posts SET state=?,status_message=?,updated_at_ms=?,next_attempt_at_ms=? WHERE post_key=?")
    .run(state,message,now,next,key);
}

export function recoverXPosts(db: Database.Database, now = Date.now()) {
  // A crashed POST may have succeeded. Never automatically create it a second time.
  db.prepare("UPDATE platform_watchlist_x_posts SET state='uncertain',status_message='Check Buffer before retrying; delivery was interrupted.',updated_at_ms=? WHERE state='sending' AND updated_at_ms<?").run(now,now-120000);
  db.prepare("UPDATE platform_watchlist_x_posts SET state='waiting',updated_at_ms=? WHERE state='preparing' AND updated_at_ms<?").run(now,now-120000);
  db.prepare("UPDATE platform_watchlist_x_posts SET state='cancelled',status_message='The selected analysis was not published. Select Post to X when ready.',updated_at_ms=? WHERE state='waiting' AND requested_at_ms<?").run(now,now-86400000);
  // Keep media while delivery is pending or uncertain. Terminal images expire after 30 days.
  db.prepare("DELETE FROM platform_watchlist_x_images WHERE post_key IN (SELECT post_key FROM platform_watchlist_x_posts WHERE state IN ('sent','cancelled','failed') AND updated_at_ms<?)").run(now-30*86400000);
}
