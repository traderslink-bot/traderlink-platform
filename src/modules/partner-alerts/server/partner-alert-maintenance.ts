import type Database from "better-sqlite3";
import { openPlatformDatabase } from "../../platform/server/database/open-platform-database";
import { PLATFORM_PREMIUM_ROLE_SCHEMA_SQL_CURRENT_ACCESS } from "../../platform/server/membership/platform-premium-role-current-access-schema";
import { PlatformErasureAdmission } from "../../platform/server/privacy/platform-erasure-admission";
import { PARTNER_ALERT_SCHEMA_STATEMENTS } from "./database/partner-alert-schema";
import { PARTNER_ALERT_WHOP_EVIDENCE_STATEMENTS } from "./database/partner-alert-whop-evidence-schema";
import { PartnerAlertAdmission } from "./partner-alert-admission";
import { PARTNER_ALERT_CONTEXT_SCHEMA_STATEMENTS } from "./partner-alert-current-context";
import { bindPartnerAlertErasureRuntime, type PartnerAlertErasureRuntime } from "./partner-alert-erasure-runtime";
import { startPartnerAlertLifecycle } from "./partner-alert-lifecycle";
import { PartnerAlertRetentionHoldRepository } from "./partner-alert-retention-holds";
import { PartnerAlertTextRetention } from "./partner-alert-text-retention";
import { PartnerAlertWhopCommercialApply } from "./partner-alert-whop-commercial-apply";
import { purgeExpiredPartnerAlertWhopEvidence } from "./partner-alert-whop-evidence-retention";
import { PartnerAlertWhopEvidenceWriter } from "./partner-alert-whop-evidence-writer";
import { PartnerAlertWhopInbox } from "./partner-alert-whop-inbox";
import { startPartnerAlertStripeRoleReconciliation } from "./partner-alert-stripe-role-reconciliation";
import { createPartnerAlertStripeRolePorts } from "./partner-alert-stripe-role-ports";
import { expireReviewedPartnerAlertStripeEvents, readConfiguredPartnerAlertStripeRetentionBinding } from "./partner-alert-stripe-retention";
import { platformPaidStripeConnectBillingMigration } from "../../platform/server/database/migrations/0209_platform_paid_stripe_connect_billing";

type Lifecycle = NonNullable<Parameters<typeof startPartnerAlertLifecycle>[0]>;
type Retention = ConstructorParameters<typeof PartnerAlertTextRetention>[2];

export function startPartnerAlertMaintenance(input: Readonly<{
  databasePath: string;
  profileCatalogSha256: string;
  erasureRuntime: PartnerAlertErasureRuntime;
  retention: Omit<Retention, "hasActiveRetentionHold">;
  retentionKeys: ConstructorParameters<typeof PartnerAlertRetentionHoldRepository>[1];
  assertRestoreStartupVerified: () => void;
  scope: ConstructorParameters<typeof PartnerAlertWhopInbox>[1]["scope"];
  bindProvider: (db: Database.Database, core: PlatformErasureAdmission) => Readonly<{
    authority: ConstructorParameters<typeof PartnerAlertWhopEvidenceWriter>[1];
    prepare: Lifecycle["prepare"];
    roles: Lifecycle["roles"];
  }>;
  onFailure: Lifecycle["onFailure"];
  stripeRetention?: Parameters<typeof expireReviewedPartnerAlertStripeEvents>[2];
  bindStripeRoles?: (db: Database.Database, core: PlatformErasureAdmission) => Readonly<{
    environment: Parameters<typeof startPartnerAlertStripeRoleReconciliation>[1]["environment"];
    ports: Omit<Parameters<typeof createPartnerAlertStripeRolePorts>[1], "nowUtc" | "reportFailure">;
  }>;
}>): () => Promise<void> {
  input.assertRestoreStartupVerified();
  const db = openPlatformDatabase({ mode: "runtime", databasePath: input.databasePath });
  try {
    const runtime = input.erasureRuntime;
    const core = PlatformErasureAdmission.bind(db, {
      nowUtc: runtime.nowUtc, maximumAdmissionMs: 30_000, profileCatalogSha256: input.profileCatalogSha256,
      participantStatements: [...PARTNER_ALERT_SCHEMA_STATEMENTS, ...PLATFORM_PREMIUM_ROLE_SCHEMA_SQL_CURRENT_ACCESS,
        ...PARTNER_ALERT_CONTEXT_SCHEMA_STATEMENTS, ...PARTNER_ALERT_WHOP_EVIDENCE_STATEMENTS],
    });
    PartnerAlertAdmission.bind(db);
    bindPartnerAlertErasureRuntime(db, runtime);
    const holds = new PartnerAlertRetentionHoldRepository(db, input.retentionKeys);
    const retention = new PartnerAlertTextRetention(db, core, {
      ...input.retention, hasActiveRetentionHold: message => holds.hasActive(message),
    });
    const provider = input.bindProvider(db, core);
    const inbox = new PartnerAlertWhopInbox(db, {
      scope: input.scope, nowUtc: runtime.nowUtc, createLeaseToken: runtime.createId,
    });
    const commercial = new PartnerAlertWhopCommercialApply(db, runtime, provider.authority);
    const evidence = new PartnerAlertWhopEvidenceWriter(db, provider.authority);
    const stripes = input.bindStripeRoles;
    if (stripes) core.qualifyAdditionalStatements(platformPaidStripeConnectBillingMigration.statements);
    const stripeRoles = stripes?.(db, core);
    const stripeRetention = input.stripeRetention ?? readConfiguredPartnerAlertStripeRetentionBinding(process.env);
    const stop = startPartnerAlertLifecycle({
      inbox, commercial, onFailure: input.onFailure,
      retention: { redactPage: (cursor, pending) => {
        try {
          if (stripeRetention) expireReviewedPartnerAlertStripeEvents(db, core, stripeRetention);
        } catch { input.onFailure(); }
        const result = retention.redactPage(cursor, pending);
        purgeExpiredPartnerAlertWhopEvidence(db, core.now());
        return result;
      } },
      prepare: claim => provider.prepare(claim), roles: provider.roles, manualRoleReview: true,
      applyCurrentFacts: (claim, preparation) => evidence.apply(claim, preparation),
    })!;
    const stopStripe = stripeRoles ? startPartnerAlertStripeRoleReconciliation(db, {
      environment: stripeRoles.environment, nowUtc: runtime.nowUtc, reportFailure: input.onFailure,
      bind: createPartnerAlertStripeRolePorts(db, { ...stripeRoles.ports, nowUtc: runtime.nowUtc, reportFailure: input.onFailure }),
    }) : null;
    let closing: Promise<void> | null = null;
    return () => closing ??= Promise.all([stop(), stopStripe?.()]).then(() => undefined).finally(() => db.close());
  } catch (error) {
    db.close();
    throw error;
  }
}
