/** Coordinator-only persistent fixture. Never imported by the app or run on production.
 * Bundle against the exact deployed staging source, then invoke with an already
 * opened, verified staging connection. Preview is read-only; apply is atomic.
 * The synthetic student deliberately has NO Discord/OAuth identity or login.
 */
import type Database from "better-sqlite3";
import { PlatformUserRepository } from "@/src/modules/platform/server/identity/platform-user-repository";
import { PlatformWorkspaceRepository } from "@/src/modules/platform/server/identity/platform-workspace-repository";
import { verifyCompletedPlatformDatabase } from "@/src/modules/platform/server/database/run-platform-migrations";
import { readAppliedPlatformMigrations } from "@/src/modules/platform/server/database/platform-migration-registry";
import { deriveJournalAccountSelectionRef } from "@/src/modules/platform/contracts/journal-account-selection";
import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { narrowWorkspaceAccessToAccount } from "@/src/modules/platform/contracts/workspace-access-scope";
import { JournalAccountRepository } from "@/src/modules/journal/server/accounts/journal-account-repository";
import { JournalAccountService, loadAccountIdentityConfiguration } from "@/src/modules/journal/server/accounts/journal-account-service";
import { ALL_JOURNAL_SOURCE_ACCOUNT_CANONICALIZERS, DEFAULT_JOURNAL_SOURCE_ACCOUNT_CANONICALIZATION_VERSION } from "@/src/modules/journal/server/accounts/journal-source-account-canonicalizers";
import { JournalImportRepository } from "@/src/modules/journal/server/imports/journal-import-repository";
import { JournalImportService, createJournalPrivacyDigester, loadJournalPrivacyHmacConfiguration } from "@/src/modules/journal/server/imports/journal-import-service";
import { JournalExecutionRepository } from "@/src/modules/journal/server/executions/journal-execution-repository";
import { JournalExecutionService } from "@/src/modules/journal/server/executions/journal-execution-service";
import { JournalExecutionReconciliationRepository } from "@/src/modules/journal/server/reconciliation/journal-execution-reconciliation-repository";
import { JournalRoundTripRepository } from "@/src/modules/journal/server/round-trips/journal-round-trip-repository";
import { JournalRoundTripService } from "@/src/modules/journal/server/round-trips/journal-round-trip-service";
import { JournalDataDecisionRepository } from "@/src/modules/journal/server/decisions/journal-data-decision-repository";
import { JournalDataDecisionService } from "@/src/modules/journal/server/decisions/journal-data-decision-service";
import { JournalManualTradePreviewRepository } from "@/src/modules/journal/server/manual-trades/journal-manual-trade-preview-repository";
import { JournalManualTradePreviewService } from "@/src/modules/journal/server/manual-trades/journal-manual-trade-preview-service";
import { createJournalManualTradePreviewAuthority } from "@/src/modules/journal/server/manual-trades/journal-manual-trade-preview-authority";
import { JournalManualTradeCommandRepository } from "@/src/modules/journal/server/manual-trades/journal-manual-trade-command-repository";
import { JournalManualTradeCommandService } from "@/src/modules/journal/server/manual-trades/journal-manual-trade-command-service";
import type { JournalManualTradeEntry } from "@/src/modules/journal/contracts/journal-manual-trade-capture-contracts";
import { JournalAnnotationRepository } from "@/src/modules/journal/server/annotations/journal-annotation-repository";
import { JournalAnnotationService } from "@/src/modules/journal/server/annotations/journal-annotation-service";
import { JournalRuleRepository } from "@/src/modules/journal/server/annotations/journal-rule-repository";
import { TraderLinkCommunityRepository } from "@/src/modules/communities/server/traderlink-community-repository";
import { TraderLinkCommunityPlatformRepository } from "@/src/modules/communities/server/traderlink-community-platform-repository";
import { TraderLinkCommunityCoachJournalReadService } from "@/src/modules/communities/server/traderlink-community-coach-journal-read-service";
import { TraderLinkCommunityCoachingProgramService } from "@/src/modules/communities/server/traderlink-community-coaching-program-service";

const KEY = "coaching-staging-student-20260926-v1";
const STUDENT = "8c6d9100-f76a-4fe1-82a8-4d32eb150001";
const WORKSPACE = "8c6d9100-f76a-4fe1-82a8-4d32eb150002";
const ACCOUNT = "8c6d9100-f76a-4fe1-82a8-4d32eb150003";
const AUDIENCE = "8c6d9100-f76a-4fe1-82a8-4d32eb150004";
const PLAN = "8c6d9100-f76a-4fe1-82a8-4d32eb150005";
const RELATIONSHIP = "8c6d9100-f76a-4fe1-82a8-4d32eb150006";
const ITEM = "8c6d9100-f76a-4fe1-82a8-4d32eb150007";
const NAME = "TEST Student - Synthetic";
const REVIEW_TITLE = "TEST Trade Review - Synthetic Trades";
const ORIGIN = "https://traderlink-platform-staging-staging.up.railway.app";
type Coach = { community_id: string; coach_profile_id: string; user_id: string; display_name: string };

function requireCondition(value: unknown, message: string): asserts value {
  if (!value) throw new Error(`staging_coaching_seed:${message}`);
}

function journalRuntime(database: Database.Database, now: Date) {
  const accounts = new JournalAccountService(new JournalAccountRepository(database),
    loadAccountIdentityConfiguration(process.env, ALL_JOURNAL_SOURCE_ACCOUNT_CANONICALIZERS,
      DEFAULT_JOURNAL_SOURCE_ACCOUNT_CANONICALIZATION_VERSION));
  const privacy = loadJournalPrivacyHmacConfiguration(process.env);
  const importRepository = new JournalImportRepository(database);
  const executions = new JournalExecutionRepository(database);
  const reconciliations = new JournalExecutionReconciliationRepository(database);
  const imports = new JournalImportService(importRepository, executions, accounts,
    createJournalPrivacyDigester(privacy), reconciliations);
  const roundTrips = new JournalRoundTripService(new JournalRoundTripRepository(database));
  const decisions = new JournalDataDecisionService(new JournalDataDecisionRepository(database),
    importRepository, imports, executions, new JournalExecutionService(executions), roundTrips, reconciliations);
  const previews = new JournalManualTradePreviewService(new JournalManualTradePreviewRepository(database),
    accounts, createJournalManualTradePreviewAuthority(privacy, { now: () => now }), () => now);
  return { accounts, previews,
    // Deliberately omit analyzer, notification and remote provider dependencies.
    commands: new JournalManualTradeCommandService(new JournalManualTradeCommandRepository(database),
      imports, decisions, roundTrips, previews),
    annotations: new JournalAnnotationService(new JournalAnnotationRepository(database), new JournalRuleRepository(database)) };
}

function sampleEntries(now: Date): JournalManualTradeEntry[] {
  const symbols = ["NVDA", "AMD", "AAPL", "MSFT", "TSLA", "META"];
  const cursor = new Date(now);
  cursor.setUTCHours(12, 0, 0, 0);
  return symbols.flatMap((symbol, index) => {
    do { cursor.setUTCDate(cursor.getUTCDate() - 1); } while ([0, 6].includes(cursor.getUTCDay()));
    const date = cursor.toISOString().slice(0, 10);
    return (["buy", "sell"] as const).map((side, leg) => ({
      clientRowRef: `${KEY}-${index}-${leg}`, localDate: date,
      localTime: leg === 0 ? "10:00:00" : "10:30:00", sourceTimezone: "America/New_York",
      normalizedSymbol: symbol, tradeCurrency: "USD", side, quantityDecimal: "10",
      priceDecimal: leg === 0 ? "100" : index % 2 === 0 ? "102" : "99",
      feesDecimal: "0",
    }));
  });
}

function verifiedResult(database: Database.Database, coach: Coach, status: string) {
  const user = database.prepare(`SELECT auth_provider,auth_subject,display_name FROM platform_users WHERE user_id=?`)
    .get(STUDENT) as { auth_provider: string; auth_subject: string; display_name: string } | undefined;
  requireCondition(user?.auth_provider === "staging_fixture" && user.auth_subject === KEY && user.display_name === NAME,
    "student_identity_collision");
  const account = database.prepare(`SELECT 1 FROM journal_accounts a JOIN platform_workspace_memberships m
ON m.workspace_id=a.workspace_id WHERE a.account_id=? AND a.workspace_id=? AND m.user_id=? AND m.role='owner'`)
    .get(ACCOUNT, WORKSPACE, STUDENT);
  requireCondition(account, "account_ownership_changed");
  const relation = database.prepare(`SELECT 1 FROM traderlink_community_coaching_relationships r
JOIN traderlink_community_coaching_plans p ON p.plan_id=r.plan_id
WHERE r.relationship_id=? AND r.community_id=? AND r.coach_user_id=? AND r.student_user_id=?
AND r.plan_id=? AND r.status='active' AND p.required_discord_role_id IS NULL`)
    .get(RELATIONSHIP, coach.community_id, coach.user_id, STUDENT, PLAN);
  requireCondition(relation, "relationship_changed_or_incomplete");
  const reviews = database.prepare(`SELECT review_id FROM traderlink_community_coaching_trade_reviews
WHERE relationship_id=? AND community_id=? AND title=?`).all(RELATIONSHIP, coach.community_id, REVIEW_TITLE) as { review_id: string }[];
  requireCondition(reviews.length === 1, "review_missing_or_ambiguous");
  const journal = new TraderLinkCommunityCoachJournalReadService(database).read({ coachUserId: coach.user_id, relationshipId: RELATIONSHIP });
  requireCondition(journal.trades.length === 6 && journal.closedTrades === 6 && journal.pendingDecisions === 0,
    "journal_verification_failed");
  requireCondition((database.pragma("foreign_key_check") as unknown[]).length === 0, "foreign_key_check_failed");
  const base = `${ORIGIN}/communities/test-community/workspace/students/${RELATIONSHIP}`;
  return { status, student: NAME, studentCanSignIn: false, trades: journal.trades.length,
    studentUrl: base, reviewUrl: `${base}/reviews/${reviews[0]!.review_id}` };
}

export function seedStagingCoachingStudent(database: Database.Database, options: { apply: boolean; confirmation?: string }) {
  requireCondition(process.env.RAILWAY_PROJECT_ID === "49fc9197-07c9-45c7-b528-57d0393c2cca" &&
    process.env.RAILWAY_SERVICE_ID === "4d264aca-510c-4f5e-bc28-e89e526b8008" &&
    process.env.RAILWAY_ENVIRONMENT_NAME === "staging", "wrong_railway_target");
  requireCondition(database.name.startsWith("/data/") && !database.inTransaction, "wrong_database_target");
  requireCondition(database.pragma("foreign_keys", { simple: true }) === 1, "foreign_keys_required");
  verifyCompletedPlatformDatabase(database);
  const history = readAppliedPlatformMigrations(database);
  requireCondition(history.length === 139 && history.at(-1)?.migration_id === "0143_traderlink_communities_review_workflow" &&
    history.at(-1)?.execution_order === 156, "unexpected_staging_schema");
  const coaches = database.prepare(`SELECT c.community_id,p.coach_profile_id,p.user_id,u.display_name
FROM traderlink_communities c JOIN traderlink_community_coach_profiles p ON p.community_id=c.community_id
JOIN platform_users u ON u.user_id=p.user_id
WHERE c.slug='test-community' AND c.discord_guild_id='1433570740430573642' AND c.status='active'
AND p.display_name='TradersLink Test Coach' AND p.status='active' AND u.status='active'`).all() as Coach[];
  requireCondition(coaches.length === 1, "coach_not_uniquely_identified");
  const coach = coaches[0]!;
  new TraderLinkCommunityRepository(database).requireCapability(coach.community_id, coach.user_id, "community.coaching.students");
  if (database.prepare(`SELECT 1 FROM platform_users WHERE user_id=?`).get(STUDENT)) {
    return verifiedResult(database, coach, "already_present_no_changes");
  }
  // Abort on partial/colliding state; never overwrite it or repair it silently.
  for (const [table, column, id] of [
    ["platform_workspaces", "workspace_id", WORKSPACE], ["journal_accounts", "account_id", ACCOUNT],
    ["traderlink_community_audiences", "audience_id", AUDIENCE], ["traderlink_community_coaching_plans", "plan_id", PLAN],
    ["traderlink_community_coaching_relationships", "relationship_id", RELATIONSHIP],
    ["traderlink_community_coaching_plan_items", "plan_item_id", ITEM],
  ]) requireCondition(!database.prepare(`SELECT 1 FROM ${table} WHERE ${column}=?`).get(id!), "seed_identifier_collision");
  requireCondition(!database.prepare(`SELECT 1 FROM platform_users WHERE auth_provider='staging_fixture' AND auth_subject=?`).get(KEY), "seed_subject_collision");
  if (!options.apply) return { status: "preview_no_changes", student: NAME, trades: 6, reviews: 1,
    studentCanSignIn: false, confirmation: `CREATE ${KEY}` };
  requireCondition(options.confirmation === `CREATE ${KEY}`, "confirmation_required");
  return database.transaction(() => {
    const now = new Date(); const at = now.toISOString();
    new PlatformUserRepository(database, { allowedAuthProviders: ["staging_fixture"] }).createUser({
      userId: STUDENT, authProvider: "staging_fixture", authSubject: KEY, displayName: NAME,
      createdAtUtc: at, updatedAtUtc: at });
    new PlatformWorkspaceRepository(database).insertWorkspaceWithOwnerInCurrentTransaction({
      workspaceId: WORKSPACE, ownerUserId: STUDENT, displayName: "TEST Coaching - Synthetic Workspace",
      defaultTradingTimezone: "America/New_York", createdAtUtc: at });
    const scope: WorkspaceAccessScope = { userId: STUDENT, workspaceId: WORKSPACE, workspaceRole: "owner",
      allowedAccountIds: [ACCOUNT], activeAccountId: ACCOUNT };
    const journal = journalRuntime(database, now);
    journal.accounts.createAccount(scope, { accountId: ACCOUNT, workspaceId: WORKSPACE,
      displayName: "TEST Coaching - Synthetic Trades", baseCurrency: "USD", tradingTimezone: "America/New_York", now });
    const selection = deriveJournalAccountSelectionRef(WORKSPACE, ACCOUNT);
    const entries = sampleEntries(now);
    const preview = journal.previews.preview(scope, { accountSelectionRef: selection, tracker: "quick", entries });
    requireCondition(preview.groups.length === 6 && preview.groups.every(group => !group.existingPosition), "unexpected_preview");
    journal.commands.commit(scope, selection, { tracker: "quick", expectedAccountSelectionRef: selection,
      idempotencyKey: KEY, entries, previewRef: preview.previewRef,
      confirmations: preview.groups.map(group => ({ groupRef: group.groupRef, relationship: "start_new_trade",
        style: "day_trade", existingPositionRef: null, completeExecutionSetConfirmed: true })) }, now);
    const trips = database.prepare(`SELECT round_trip_id FROM journal_round_trips WHERE workspace_id=? AND account_id=? ORDER BY round_trip_id`)
      .all(WORKSPACE, ACCOUNT) as { round_trip_id: string }[];
    requireCondition(trips.length === 6, "unexpected_trade_count");
    const accountScope = narrowWorkspaceAccessToAccount(scope, ACCOUNT);
    for (const trip of trips) journal.annotations.saveRoundTripNote(accountScope, { roundTripId: trip.round_trip_id,
      expectedRevision: null, technicalNote: "SYNTHETIC TEST DATA - prices and executions are invented for coaching testing.",
      tradeNote: "TEST student note: review my entry, exit, risk and patience. This is not a real trade." });
    database.prepare(`INSERT INTO traderlink_community_audiences(audience_id,community_id,name,mode,status,created_by_user_id,created_at_utc,updated_at_utc)
VALUES(?,?,?,'discord_roles','active',?,?,?)`).run(AUDIENCE, coach.community_id, "TEST Synthetic Coaching Only", coach.user_id, at, at);
    database.prepare(`INSERT INTO traderlink_community_coaching_plans(plan_id,coach_profile_id,community_id,name,description,cadence,trade_review_limit,price_label,payment_instructions,audience_id,status,created_at_utc,updated_at_utc,student_capacity,messaging_included,trade_reviews_included,required_discord_role_id)
VALUES(?,?,?,?,?,'weekly',6,?,'',?,'active',?,?,1,1,1,NULL)`).run(PLAN, coach.coach_profile_id, coach.community_id,
      "TEST Coaching Plan - Synthetic", "Synthetic student and invented trades for staging-only coach testing.", "TEST - no payment", AUDIENCE, at, at);
    database.prepare(`INSERT INTO traderlink_community_coaching_plan_items(plan_item_id,plan_id,community_id,item_type,frequency,coverage_period,quantity,due_offset_days,selection_mode,follow_up_days,ordinal,measurement_kind)
VALUES(?,?,?,'trade_review','weekly','custom',6,1,'coach_or_student',7,0,'trades')`).run(ITEM, PLAN, coach.community_id);
    database.prepare(`INSERT INTO traderlink_community_coaching_relationships(relationship_id,community_id,coach_profile_id,coach_user_id,student_user_id,plan_id,status,requested_at_utc,started_at_utc,ended_at_utc,student_messaging_enabled,student_trade_reviews_enabled)
VALUES(?,?,?,?,?,?,'active',?,?,NULL,1,1)`).run(RELATIONSHIP, coach.community_id, coach.coach_profile_id, coach.user_id, STUDENT, PLAN, at, at);
    const studentActor = { userId: STUDENT, displayName: NAME, discordRoleIds: [] };
    new TraderLinkCommunityPlatformRepository(database).grantJournal({ communityId: coach.community_id, actor: studentActor,
      relationshipId: RELATIONSHIP, journalAccountId: ACCOUNT, dataScope: "complete", atUtc: at });
    const program = new TraderLinkCommunityCoachingProgramService(database);
    const reviewId = program.createReview({ communityId: coach.community_id, actor: studentActor, relationshipId: RELATIONSHIP,
      reviewType: "multiple_trades", title: REVIEW_TITLE,
      context: "SYNTHETIC TEST: two trades are already in To review. Find trades contains four more to add. Save each trade review, then preview the final review.",
      roundTripIds: trips.slice(0, 2).map(trip => trip.round_trip_id), atUtc: at });
    program.setReviewDueDate({ communityId: coach.community_id, relationshipId: RELATIONSHIP, reviewId,
      actor: { userId: coach.user_id, displayName: coach.display_name, discordRoleIds: [] },
      dueAtUtc: new Date(now.getTime() + 86400000).toISOString(), atUtc: at });
    return verifiedResult(database, coach, "created");
  }).immediate();
}
