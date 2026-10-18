import Database from "better-sqlite3";
import { randomUUID } from "node:crypto";
import { emptyMembershipPlan, newMembershipPlanPrice } from "../../contracts/membership-plan-editor";
import { newMembershipProductFeature } from "../../contracts/membership-product-features";
import { writeMembershipPlanEditor } from "./membership-plan-editor-write";
import { PlatformMembershipRepository } from "./platform-membership-repository";
import { platformMembershipAddonAmendmentsMigration } from "../database/migrations/0167_platform_membership_addon_amendments";
import { platformIdentityMigration } from "../database/migrations/0001_platform_identity";
import { platformAuthenticationIdentitiesMigration } from "../database/migrations/0012_platform_authentication_identities";
import { platformDiscordMembershipsMigration } from "../database/migrations/0017_platform_discord_memberships";
import { platformMembershipPlatformMigration } from "../database/migrations/0148_platform_membership_platform";
import { platformMembershipGenerationAllowancesMigration } from "../database/migrations/0150_platform_membership_generation_allowances";
import { platformMembershipFeatureCopyMigration } from "../database/migrations/0157_platform_membership_feature_copy";
import { platformMemberPrivateWatchlistsMigration } from "../database/migrations/0158_platform_member_private_watchlists";
import { platformMembershipUnifiedEditorMigration } from "../database/migrations/0165_platform_membership_unified_editor";
export const amendmentAt = "2026-10-15T12:00:00.000Z";
export const amendmentEnd = "2026-11-01T12:00:00.000Z";
export function amendmentFixture() {
  const db = new Database(":memory:"); db.pragma("foreign_keys=ON");
  for (const migration of [platformIdentityMigration, platformAuthenticationIdentitiesMigration, platformDiscordMembershipsMigration,
    platformMembershipPlatformMigration, platformMembershipGenerationAllowancesMigration, platformMembershipFeatureCopyMigration,
    platformMemberPrivateWatchlistsMigration, platformMembershipUnifiedEditorMigration, platformMembershipAddonAmendmentsMigration]) for (const sql of migration.statements) db.exec(sql);
  const user = randomUUID(), subscriptionId = randomUUID();
  db.prepare("INSERT INTO platform_users VALUES (?,'test','owner','Owner','active',?,?)").run(user,amendmentAt,amendmentAt);
  db.prepare("INSERT INTO platform_membership_provider_definitions VALUES ('stripe','Stripe','native','ready',?,?,?)").run(user,amendmentAt,amendmentAt);
  const publish = (type: "plan" | "addon", name: string, amount: string, limit: number | null) => {
    const doc = emptyMembershipPlan(); Object.assign(doc,{ name, visibility:"public", packageType:type });
    doc.features = [...(type==='plan'?doc.features:[]), { ...newMembershipProductFeature("trade_analyzer.analyses",limit), resetDays:30 }];
    const price = newMembershipPlanPrice(randomUUID()); Object.assign(price,{name,billing:"recurring",provider:"stripe",initialPrice:amount,renewalPrice:amount}); doc.prices=[price];
    return writeMembershipPlanEditor(db,user,{requestId:randomUUID(),draftId:null,revision:null,document:doc,intent:"publish",applyToMembers:false},amendmentAt);
  };
  const base=publish('plan','Existing plan','20',10), addon=publish('addon','Extra analyses','10',20);
  const repo=new PlatformMembershipRepository(db);
  repo.grantEntitlement({ actorUserId:user,userId:user,planVersionId:base.versionId!,sourceType:'subscription',sourceRef:'sub_test_synthetic',startsAtUtc:'2026-10-01T12:00:00.000Z',endsAtUtc:amendmentEnd,atUtc:amendmentAt });
  db.prepare(`INSERT INTO platform_membership_provider_subscriptions VALUES (?,?,?,'stripe','cus_test_synthetic','sub_test_synthetic','active',?,?,0,?,?,?)`)
    .run(subscriptionId,user,base.offerIds![0],'2026-10-01T12:00:00.000Z',amendmentEnd,amendmentAt,amendmentAt,amendmentAt);
  return { db,user,subscriptionId,base,addon,publish,repo };
}
