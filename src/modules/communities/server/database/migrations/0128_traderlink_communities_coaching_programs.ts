import type { PlatformMigration } from "@/src/modules/platform/server/database/platform-migration-contract";

const uuid=(column:string)=>`CHECK (length(${column})=36 AND ${column}=lower(${column}) AND substr(${column},14,1)='-' AND substr(${column},15,1)='4')`;
const utc=(column:string)=>`CHECK (length(${column})=24 AND ${column} GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]Z')`;

export const traderLinkCommunitiesCoachingProgramsMigration:PlatformMigration=Object.freeze({
 moduleNamespace:"community",migrationId:"0128_traderlink_communities_coaching_programs",executionOrder:128,
 statements:Object.freeze([`ALTER TABLE traderlink_community_coaching_plans ADD COLUMN student_capacity INTEGER NOT NULL DEFAULT 10 CHECK(student_capacity BETWEEN 1 AND 10000);
ALTER TABLE traderlink_community_coaching_plans ADD COLUMN messaging_included INTEGER NOT NULL DEFAULT 0 CHECK(messaging_included IN (0,1));
ALTER TABLE traderlink_community_coaching_plans ADD COLUMN trade_reviews_included INTEGER NOT NULL DEFAULT 0 CHECK(trade_reviews_included IN (0,1));
ALTER TABLE traderlink_community_coaching_plans ADD COLUMN sessions_included INTEGER NOT NULL DEFAULT 0 CHECK(sessions_included IN (0,1));
ALTER TABLE traderlink_community_coaching_plans ADD COLUMN teaching_included INTEGER NOT NULL DEFAULT 0 CHECK(teaching_included IN (0,1));

ALTER TABLE traderlink_community_coaching_trade_reviews ADD COLUMN review_type TEXT NOT NULL DEFAULT 'single_trade' CHECK(review_type IN ('single_trade','multiple_trades','weekly','monthly','general','session','custom'));
ALTER TABLE traderlink_community_coaching_trade_reviews ADD COLUMN period_start TEXT;
ALTER TABLE traderlink_community_coaching_trade_reviews ADD COLUMN period_end TEXT;

CREATE TABLE traderlink_community_coaching_review_trades(
 review_id TEXT NOT NULL ${uuid("review_id")},community_id TEXT NOT NULL ${uuid("community_id")},round_trip_id TEXT NOT NULL ${uuid("round_trip_id")},ordinal INTEGER NOT NULL CHECK(ordinal BETWEEN 0 AND 499),
 PRIMARY KEY(review_id,round_trip_id),UNIQUE(review_id,ordinal),
 FOREIGN KEY(review_id) REFERENCES traderlink_community_coaching_trade_reviews(review_id) ON DELETE CASCADE
) STRICT,WITHOUT ROWID;

CREATE TABLE traderlink_community_coaching_sessions(
 session_id TEXT PRIMARY KEY ${uuid("session_id")},relationship_id TEXT NOT NULL ${uuid("relationship_id")},community_id TEXT NOT NULL ${uuid("community_id")},coach_user_id TEXT NOT NULL ${uuid("coach_user_id")},title TEXT NOT NULL CHECK(length(trim(title)) BETWEEN 1 AND 160),agenda TEXT NOT NULL DEFAULT '' CHECK(length(agenda)<=8000),notes TEXT NOT NULL DEFAULT '' CHECK(length(notes)<=12000),scheduled_at_utc TEXT,completed_at_utc TEXT,status TEXT NOT NULL CHECK(status IN ('scheduled','completed','cancelled')),created_at_utc TEXT NOT NULL ${utc("created_at_utc")},updated_at_utc TEXT NOT NULL ${utc("updated_at_utc")},UNIQUE(session_id,community_id),FOREIGN KEY(relationship_id,community_id) REFERENCES traderlink_community_coaching_relationships(relationship_id,community_id) ON DELETE RESTRICT,FOREIGN KEY(coach_user_id) REFERENCES platform_users(user_id) ON DELETE RESTRICT
) STRICT;

CREATE TABLE traderlink_community_coaching_teaching_items(
 teaching_id TEXT PRIMARY KEY ${uuid("teaching_id")},community_id TEXT NOT NULL ${uuid("community_id")},coach_user_id TEXT NOT NULL ${uuid("coach_user_id")},title TEXT NOT NULL CHECK(length(trim(title)) BETWEEN 1 AND 160),teaching_type TEXT NOT NULL CHECK(teaching_type IN ('lesson','class','assignment')),body TEXT NOT NULL DEFAULT '' CHECK(length(body)<=20000),delivery_url TEXT NOT NULL DEFAULT '' CHECK(length(delivery_url)<=1000),scheduled_at_utc TEXT,status TEXT NOT NULL CHECK(status IN ('draft','published','completed','cancelled')),audience_mode TEXT NOT NULL CHECK(audience_mode IN ('all_students','plan','selected_students')),plan_id TEXT,created_at_utc TEXT NOT NULL ${utc("created_at_utc")},updated_at_utc TEXT NOT NULL ${utc("updated_at_utc")},UNIQUE(teaching_id,community_id),FOREIGN KEY(community_id) REFERENCES traderlink_communities(community_id) ON DELETE RESTRICT,FOREIGN KEY(coach_user_id) REFERENCES platform_users(user_id) ON DELETE RESTRICT,FOREIGN KEY(plan_id) REFERENCES traderlink_community_coaching_plans(plan_id) ON DELETE RESTRICT
) STRICT;

CREATE TABLE traderlink_community_coaching_teaching_students(
 teaching_id TEXT NOT NULL ${uuid("teaching_id")},community_id TEXT NOT NULL ${uuid("community_id")},relationship_id TEXT NOT NULL ${uuid("relationship_id")},status TEXT NOT NULL CHECK(status IN ('assigned','attending','completed','excused')),completed_at_utc TEXT,updated_at_utc TEXT NOT NULL ${utc("updated_at_utc")},PRIMARY KEY(teaching_id,relationship_id),FOREIGN KEY(teaching_id,community_id) REFERENCES traderlink_community_coaching_teaching_items(teaching_id,community_id) ON DELETE CASCADE,FOREIGN KEY(relationship_id,community_id) REFERENCES traderlink_community_coaching_relationships(relationship_id,community_id) ON DELETE RESTRICT
) STRICT,WITHOUT ROWID;

CREATE TABLE traderlink_community_coaching_attachments(
 attachment_id TEXT PRIMARY KEY ${uuid("attachment_id")},relationship_id TEXT NOT NULL ${uuid("relationship_id")},community_id TEXT NOT NULL ${uuid("community_id")},uploaded_by_user_id TEXT NOT NULL ${uuid("uploaded_by_user_id")},target_type TEXT NOT NULL CHECK(target_type IN ('message','review','session','teaching','submission')),target_id TEXT NOT NULL ${uuid("target_id")},filename TEXT NOT NULL CHECK(length(trim(filename)) BETWEEN 1 AND 180),media_type TEXT NOT NULL CHECK(media_type IN ('image/png','image/jpeg','image/webp')),byte_length INTEGER NOT NULL CHECK(byte_length BETWEEN 1 AND 8388608),sha256 TEXT NOT NULL CHECK(length(sha256)=64 AND sha256 NOT GLOB '*[^0-9a-f]*'),content BLOB NOT NULL CHECK(typeof(content)='blob' AND length(content)=byte_length),created_at_utc TEXT NOT NULL ${utc("created_at_utc")},UNIQUE(attachment_id,community_id),FOREIGN KEY(relationship_id,community_id) REFERENCES traderlink_community_coaching_relationships(relationship_id,community_id) ON DELETE RESTRICT,FOREIGN KEY(uploaded_by_user_id) REFERENCES platform_users(user_id) ON DELETE RESTRICT
) STRICT;
CREATE INDEX traderlink_community_coaching_attachments_target ON traderlink_community_coaching_attachments(target_type,target_id,created_at_utc);

CREATE TABLE traderlink_community_coaching_review_replies(
 reply_id TEXT PRIMARY KEY ${uuid("reply_id")},review_id TEXT NOT NULL ${uuid("review_id")},community_id TEXT NOT NULL ${uuid("community_id")},author_user_id TEXT NOT NULL ${uuid("author_user_id")},body TEXT NOT NULL CHECK(length(trim(body)) BETWEEN 1 AND 8000),created_at_utc TEXT NOT NULL ${utc("created_at_utc")},UNIQUE(reply_id,community_id),FOREIGN KEY(review_id) REFERENCES traderlink_community_coaching_trade_reviews(review_id) ON DELETE RESTRICT,FOREIGN KEY(author_user_id) REFERENCES platform_users(user_id) ON DELETE RESTRICT
) STRICT;`]),
});
