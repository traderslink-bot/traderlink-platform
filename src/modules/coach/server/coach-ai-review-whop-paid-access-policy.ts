import type Database from "better-sqlite3";

import type { WorkspaceAccessScope } from
  "@/src/modules/platform/contracts/workspace-access-scope";
import { readWhopAiReviewConfigurationHealth } from
  "@/src/modules/platform/server/billing/whop-ai-review-configuration";
import {
  isWhopAiReviewEntitlementSchemaAvailable,
  WhopAiReviewEntitlementRepository,
} from "@/src/modules/platform/server/billing/whop-ai-review-entitlement-repository";

import type {
  CoachAiReviewPaidAccessPolicyV2,
  CoachAiReviewPaidAccessStateV2,
} from "./coach-ai-review-generation-coordinator-v2";

export class CoachAiReviewWhopPaidAccessPolicyV2
implements CoachAiReviewPaidAccessPolicyV2 {
  constructor(
    private readonly database: Database.Database,
    private readonly environment: NodeJS.ProcessEnv = process.env,
  ) {}

  read(scope?: WorkspaceAccessScope): CoachAiReviewPaidAccessStateV2 {
    if (!isWhopAiReviewEntitlementSchemaAvailable(this.database) ||
        !readWhopAiReviewConfigurationHealth(this.environment).readyForEntitlement) {
      return "not_connected";
    }
    if (!scope) return "available";
    return new WhopAiReviewEntitlementRepository(this.database)
      .readAccess(scope.userId).state === "active" ? "available" : "not_connected";
  }
}
