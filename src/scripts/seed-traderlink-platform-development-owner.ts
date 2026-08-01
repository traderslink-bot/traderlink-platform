import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { authorizeDevelopmentOwnerSeed } from "@/src/modules/platform/server/bootstrap/development-owner-seed-authorization";
import {
  createDevelopmentOwnerSeedConfirmationAuthority,
  loadDevelopmentOwnerSeedConfirmationKey,
} from "@/src/modules/platform/server/bootstrap/development-owner-seed-confirmation";
import {
  confirmDevelopmentOwnerSeed,
  DEVELOPMENT_OWNER_SEED_CONFIRMATION_ACTION,
  previewDevelopmentOwnerSeed,
  verifyDevelopmentOwnerSeed,
} from "@/src/modules/platform/server/bootstrap/seed-development-owner";
import { openPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";

const DEVELOPMENT_OWNER_FACTS = Object.freeze({
  userDisplayName: "TraderLink Development Owner",
  workspaceDisplayName: "TraderLink Development Workspace",
  defaultTradingTimezone: "America/New_York",
  baseCurrency: "USD",
  journalAccountDisplayName: "Primary Trading Account",
});

export function runTraderLinkPlatformDevelopmentOwnerSeed(
  arguments_: readonly string[] = process.argv.slice(2),
): unknown {
  const authorization = authorizeDevelopmentOwnerSeed();
  const confirmationAuthority =
    createDevelopmentOwnerSeedConfirmationAuthority({
      key: loadDevelopmentOwnerSeedConfirmationKey(),
    });
  const database = openPlatformDatabase({ mode: "runtime" });
  try {
    if (arguments_.length === 1 && arguments_[0] === "--preview") {
      return previewDevelopmentOwnerSeed({
        database,
        authorization,
        confirmationAuthority,
        facts: DEVELOPMENT_OWNER_FACTS,
      });
    }
    if (arguments_.length === 1 && arguments_[0] === "--verify") {
      return verifyDevelopmentOwnerSeed({
        database,
        facts: DEVELOPMENT_OWNER_FACTS,
      });
    }
    const confirmationToken = arguments_.find((argument) =>
      argument.startsWith("--confirm-token="),
    );
    if (arguments_.length !== 1 || !confirmationToken) {
      throw new Error("TRADERLINK_DEVELOPMENT_OWNER_SEED_CONFIRMATION_INVALID");
    }
    return confirmDevelopmentOwnerSeed({
      database,
      authorization,
      confirmationAuthority,
      facts: DEVELOPMENT_OWNER_FACTS,
      confirmationAction: DEVELOPMENT_OWNER_SEED_CONFIRMATION_ACTION,
      confirmationToken: confirmationToken.slice("--confirm-token=".length),
    });
  } finally {
    database.close();
  }
}

function isDirectExecution(): boolean {
  const invokedPath = process.argv[1];
  if (!invokedPath) return false;
  return (
    resolve(invokedPath).toLowerCase() ===
    fileURLToPath(import.meta.url).toLowerCase()
  );
}

if (isDirectExecution()) {
  try {
    console.info(
      JSON.stringify(runTraderLinkPlatformDevelopmentOwnerSeed(), null, 2),
    );
  } catch (error) {
    console.error(
      JSON.stringify({
        code:
          error instanceof Error
            ? error.message
            : "TRADERLINK_DEVELOPMENT_OWNER_SEED_FAILED",
      }),
    );
    process.exitCode = 1;
  }
}
