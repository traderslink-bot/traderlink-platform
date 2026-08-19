import { loadTraderLinkPlatformLocalDevelopmentConfiguration } from
  "@/src/modules/platform/server/authentication/local-development-configuration";
import { openPlatformDatabase } from
  "@/src/modules/platform/server/database/open-platform-database";
import { CoachAiReviewGenerationContractRepository } from
  "@/src/modules/coach/server/coach-ai-review-generation-contract-repository";

const CONFIRMATION = "--confirm-backed-up-v4-authoring-cutover";

function main(): void {
  if (process.argv[2] !== CONFIRMATION) {
    throw new Error("ai_review_authored_cutover_confirmation_required");
  }
  loadTraderLinkPlatformLocalDevelopmentConfiguration({ repositoryRoot: process.cwd() });
  const database = openPlatformDatabase({ mode: "runtime" });
  try {
    const contracts = new CoachAiReviewGenerationContractRepository(database);
    const readiness = contracts.readCutoverReadiness();
    if (!readiness.ready) {
      throw new Error("ai_review_authored_cutover_readiness_failed");
    }
    const state = contracts.activateV3({
      requestIntakeStopped: true,
      verifiedBackupCompleted: true,
      oldProcessesStopped: true,
      v2ReadReconciliationCompleted: true,
    });
    process.stdout.write(JSON.stringify({
      activeGenerationContractVersion: state.activeGenerationContractVersion,
      minimumReaderContractVersion: state.minimumReaderContractVersion,
      transitionGeneration: state.transitionGeneration,
      transitionedAtUtc: state.transitionedAtUtc,
    }) + "\n");
  } finally {
    database.close();
  }
}

main();
