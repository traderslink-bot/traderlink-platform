import type Database from "better-sqlite3";
import { hasAiReviewGenerationAccess } from "@/src/modules/platform/server/membership/membership-ai-review-access";
import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";

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
    // Global readiness cannot require Whop: a plan or add-on may provide access.
    // Every actual account is independently checked before dispatch/issuance.
    return !scope || hasAiReviewGenerationAccess(this.database,scope.userId) ? "available" : "not_connected";
  }
}
