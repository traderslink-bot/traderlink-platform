import type {PlatformMigration} from "@/src/modules/platform/server/database/platform-migration-contract";

const uuid=(column:string)=>`CHECK (${column} IS NULL OR (length(${column})=36 AND ${column}=lower(${column}) AND substr(${column},14,1)='-' AND substr(${column},15,1)='4'))`;
const utc=(column:string)=>`CHECK (${column} IS NULL OR (length(${column})=24 AND ${column} GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]Z'))`;

export const traderLinkCommunitiesReviewWorkflowMigration:PlatformMigration=Object.freeze({
 moduleNamespace:"community",migrationId:"0143_traderlink_communities_review_workflow",executionOrder:143,
 statements:Object.freeze([`ALTER TABLE traderlink_community_journal_grants ADD COLUMN shared_fields_json TEXT NOT NULL DEFAULT '[]' CHECK(json_valid(shared_fields_json));
ALTER TABLE traderlink_community_coaching_trade_reviews ADD COLUMN delivery_state TEXT NOT NULL DEFAULT 'draft' CHECK(delivery_state IN ('draft','delivered','viewed','follow_up','completed','cancelled'));
ALTER TABLE traderlink_community_coaching_trade_reviews ADD COLUMN due_at_utc TEXT ${utc("due_at_utc")};
ALTER TABLE traderlink_community_coaching_trade_reviews ADD COLUMN delivered_at_utc TEXT ${utc("delivered_at_utc")};
ALTER TABLE traderlink_community_coaching_trade_reviews ADD COLUMN viewed_at_utc TEXT ${utc("viewed_at_utc")};
ALTER TABLE traderlink_community_coaching_trade_reviews ADD COLUMN follow_up_due_at_utc TEXT ${utc("follow_up_due_at_utc")};
ALTER TABLE traderlink_community_coaching_trade_reviews ADD COLUMN cancelled_at_utc TEXT ${utc("cancelled_at_utc")};
UPDATE traderlink_community_coaching_trade_reviews SET delivery_state=CASE status WHEN 'completed' THEN 'completed' WHEN 'cancelled' THEN 'cancelled' ELSE 'draft' END,delivered_at_utc=CASE WHEN status='completed' THEN coalesce(completed_at_utc,updated_at_utc) ELSE NULL END;

ALTER TABLE traderlink_community_coaching_review_trades ADD COLUMN selected_by_user_id TEXT ${uuid("selected_by_user_id")};
ALTER TABLE traderlink_community_coaching_review_trades ADD COLUMN selection_source TEXT NOT NULL DEFAULT 'coach' CHECK(selection_source IN ('coach','student'));
ALTER TABLE traderlink_community_coaching_review_trades ADD COLUMN workflow_state TEXT NOT NULL DEFAULT 'queued' CHECK(workflow_state IN ('queued','saved','removed'));
ALTER TABLE traderlink_community_coaching_review_trades ADD COLUMN coach_feedback TEXT NOT NULL DEFAULT '' CHECK(length(coach_feedback)<=12000);
ALTER TABLE traderlink_community_coaching_review_trades ADD COLUMN trade_label TEXT NOT NULL DEFAULT '' CHECK(length(trade_label)<=240);
ALTER TABLE traderlink_community_coaching_review_trades ADD COLUMN saved_at_utc TEXT ${utc("saved_at_utc")};
ALTER TABLE traderlink_community_coaching_review_trades ADD COLUMN removed_at_utc TEXT ${utc("removed_at_utc")};
ALTER TABLE traderlink_community_coaching_review_trades ADD COLUMN updated_at_utc TEXT ${utc("updated_at_utc")};
UPDATE traderlink_community_coaching_review_trades AS selected SET selected_by_user_id=(SELECT requested_by_user_id FROM traderlink_community_coaching_trade_reviews review WHERE review.review_id=selected.review_id),selection_source=CASE WHEN EXISTS(SELECT 1 FROM traderlink_community_coaching_trade_reviews review JOIN traderlink_community_coaching_relationships relationship ON relationship.relationship_id=review.relationship_id WHERE review.review_id=selected.review_id AND review.requested_by_user_id=relationship.student_user_id) THEN 'student' ELSE 'coach' END,updated_at_utc=(SELECT updated_at_utc FROM traderlink_community_coaching_trade_reviews review WHERE review.review_id=selected.review_id);

CREATE TABLE traderlink_community_coaching_review_actions(
 action_id TEXT PRIMARY KEY ${uuid("action_id")},review_id TEXT NOT NULL ${uuid("review_id")},relationship_id TEXT NOT NULL ${uuid("relationship_id")},community_id TEXT NOT NULL ${uuid("community_id")},created_by_user_id TEXT NOT NULL ${uuid("created_by_user_id")},title TEXT NOT NULL CHECK(length(trim(title)) BETWEEN 1 AND 240),details TEXT NOT NULL DEFAULT '' CHECK(length(details)<=4000),due_at_utc TEXT ${utc("due_at_utc")},status TEXT NOT NULL CHECK(status IN ('open','completed','cancelled')),completed_at_utc TEXT ${utc("completed_at_utc")},created_at_utc TEXT NOT NULL ${utc("created_at_utc")},updated_at_utc TEXT NOT NULL ${utc("updated_at_utc")},UNIQUE(action_id,community_id),FOREIGN KEY(review_id) REFERENCES traderlink_community_coaching_trade_reviews(review_id) ON DELETE RESTRICT,FOREIGN KEY(relationship_id,community_id) REFERENCES traderlink_community_coaching_relationships(relationship_id,community_id) ON DELETE RESTRICT,FOREIGN KEY(created_by_user_id) REFERENCES platform_users(user_id) ON DELETE RESTRICT
) STRICT;
CREATE INDEX traderlink_community_coaching_review_actions_review ON traderlink_community_coaching_review_actions(review_id,status,due_at_utc);

CREATE TABLE traderlink_community_coaching_review_attachment_links(
 attachment_id TEXT PRIMARY KEY ${uuid("attachment_id")},review_id TEXT NOT NULL ${uuid("review_id")},round_trip_id TEXT ${uuid("round_trip_id")},community_id TEXT NOT NULL ${uuid("community_id")},FOREIGN KEY(attachment_id,community_id) REFERENCES traderlink_community_coaching_attachments(attachment_id,community_id) ON DELETE CASCADE,FOREIGN KEY(review_id) REFERENCES traderlink_community_coaching_trade_reviews(review_id) ON DELETE RESTRICT
) STRICT,WITHOUT ROWID;

CREATE TABLE traderlink_community_coaching_review_events(
 event_id TEXT PRIMARY KEY ${uuid("event_id")},review_id TEXT NOT NULL ${uuid("review_id")},relationship_id TEXT NOT NULL ${uuid("relationship_id")},community_id TEXT NOT NULL ${uuid("community_id")},actor_user_id TEXT NOT NULL ${uuid("actor_user_id")},event_type TEXT NOT NULL CHECK(event_type IN ('started','trade_added','trade_removed','trade_saved','delivered','viewed','follow_up_required','completed','cancelled')),occurred_at_utc TEXT NOT NULL ${utc("occurred_at_utc")},details_json TEXT NOT NULL DEFAULT '{}' CHECK(json_valid(details_json)),UNIQUE(event_id,community_id),FOREIGN KEY(review_id) REFERENCES traderlink_community_coaching_trade_reviews(review_id) ON DELETE RESTRICT,FOREIGN KEY(relationship_id,community_id) REFERENCES traderlink_community_coaching_relationships(relationship_id,community_id) ON DELETE RESTRICT,FOREIGN KEY(actor_user_id) REFERENCES platform_users(user_id) ON DELETE RESTRICT
) STRICT;
CREATE INDEX traderlink_community_coaching_review_events_review ON traderlink_community_coaching_review_events(review_id,occurred_at_utc);`]),
});
