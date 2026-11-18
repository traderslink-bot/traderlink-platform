import { requireJournalMutationRequest } from "../authentication/journal-mutation-request-security";
import { requireTraderLinkPlatformAuthenticatedRequestIdentity,
  type TraderLinkPlatformRequestIdentity } from "../authentication/require-platform-request-scope";
import { withPlatformDatabase } from "../database/open-platform-database";
import { platformFailure } from "../database/platform-migration-contract";
import { readPartnerAlertStripeErasureWorkerInputs } from "../../../partner-alerts/server/partner-alert-stripe-erasure-worker-input";
import { hasPlatformErasureModules, PlatformErasureAdmission } from "./platform-erasure-admission";
import { readmitAuthenticatedErasureCommand, type ErasureCommand } from "./platform-erasure-command";

/** Bounded request preparation. All root deletion and provider preparation stays
 * in the worker. IPC retains the existing authenticated command envelope. */
export function prepareAuthenticatedErasureRequest(request: Request, identity: TraderLinkPlatformRequestIdentity,
  command: ErasureCommand, databasePath: string, environment: NodeJS.ProcessEnv = process.env): void {
  if (command.action !== "traderlink_account") return;
  requireJournalMutationRequest(request);
  withPlatformDatabase({ mode: "runtime", databasePath, environment }, database => {
    if (!hasPlatformErasureModules(database)) return;
    const review = readPartnerAlertStripeErasureWorkerInputs(database, environment);
    if (!review) return platformFailure("TRADERLINK_ACCOUNT_ERASURE_CONFLICT");
    // Historical formats retain their original admission protocol.
    if (!("releaseFormat" in review) || review.releaseFormat !== "v5") return;
    if (typeof review.erasureProfileRef !== "string") return platformFailure("TRADERLINK_ACCOUNT_ERASURE_CONFLICT");
    const core = PlatformErasureAdmission.bind(database, { nowUtc: review.nowUtc, maximumAdmissionMs: 30_000,
      profileCatalogSha256: review.profileCatalogSha256, participantStatements: [] });
    const original = JSON.stringify(identity);
    readmitAuthenticatedErasureCommand(database, {
      core, request, identity, command, environment, profileRef: review.erasureProfileRef,
      verify: () => {
        review.assertCurrentRelease();
        requireJournalMutationRequest(request);
        const current = requireTraderLinkPlatformAuthenticatedRequestIdentity(request.headers, { databasePath, environment });
        if (JSON.stringify(current) !== original) return platformFailure("TRADERLINK_WORKSPACE_ACCESS_DENIED");
      },
    });
  });
}
