import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const PRODUCTION_FILES = Object.freeze([
  "src/modules/platform/server/bootstrap/development-owner-seed-authorization.ts",
  "src/modules/platform/server/bootstrap/development-owner-seed-confirmation.ts",
  "src/modules/platform/server/bootstrap/seed-development-owner.ts",
]);

const TEST_FILES = Object.freeze([
  "src/modules/platform/server/bootstrap/development-owner-seed-authorization.test.ts",
  "src/modules/platform/server/bootstrap/development-owner-seed-confirmation.test.ts",
  "src/modules/platform/server/bootstrap/seed-development-owner.test.ts",
]);

const FORBIDDEN_PRODUCTION_PATTERNS = Object.freeze([
  /\bdiscord\b/iu,
  /\boauth\b/iu,
  /\bacademy\b/iu,
  /console\.(?:debug|error|info|log|warn)\s*\(/u,
]);

function requireText(
  sourceText: string,
  pattern: RegExp,
  sourcePath: string,
): void {
  if (!pattern.test(sourceText)) {
    throw new Error(`TRADERLINK_DEVELOPMENT_OWNER_SEED_FILE_INVALID:${sourcePath}`);
  }
}

export function verifyTraderLinkPlatformDevelopmentOwnerSeedFiles(
  repositoryRoot = process.cwd(),
): Readonly<{ productionFiles: number; testFiles: number }> {
  const sources = new Map(
    [...PRODUCTION_FILES, ...TEST_FILES].map((sourcePath) => [
      sourcePath,
      readFileSync(resolve(repositoryRoot, sourcePath), "utf8"),
    ]),
  );

  for (const sourcePath of PRODUCTION_FILES) {
    const sourceText = sources.get(sourcePath) ?? "";
    if (FORBIDDEN_PRODUCTION_PATTERNS.some((pattern) => pattern.test(sourceText))) {
      throw new Error(
        `TRADERLINK_DEVELOPMENT_OWNER_SEED_FILE_INVALID:${sourcePath}`,
      );
    }
  }

  const authorization =
    sources.get(PRODUCTION_FILES[0]) ?? "";
  requireText(authorization, /"development_local"/u, PRODUCTION_FILES[0]);
  requireText(
    authorization,
    /TRADERLINK_PLATFORM_ALLOW_DEVELOPMENT_OWNER_SEED/u,
    PRODUCTION_FILES[0],
  );
  requireText(authorization, /NODE_ENV\s*===\s*"production"/u, PRODUCTION_FILES[0]);
  requireText(authorization, /VERCEL_ENV\s*===\s*"production"/u, PRODUCTION_FILES[0]);

  const confirmation = sources.get(PRODUCTION_FILES[1]) ?? "";
  requireText(confirmation, /createHmac\("sha256"/u, PRODUCTION_FILES[1]);
  requireText(confirmation, /timingSafeEqual/u, PRODUCTION_FILES[1]);
  requireText(confirmation, /DEFAULT_TOKEN_TTL_MS\s*=\s*5\s*\*\s*60\s*\*\s*1000/u, PRODUCTION_FILES[1]);

  const seed = sources.get(PRODUCTION_FILES[2]) ?? "";
  requireText(seed, /"confirm_development_owner_seed"/u, PRODUCTION_FILES[2]);
  requireText(seed, /requireEmptyFoundation\(options\.database\)/u, PRODUCTION_FILES[2]);
  requireText(seed, /\.transaction\(\(\)\s*=>/u, PRODUCTION_FILES[2]);
  requireText(seed, /\.immediate\(\)/u, PRODUCTION_FILES[2]);
  requireText(seed, /journal_account_source_identities:\s*0/u, PRODUCTION_FILES[2]);
  requireText(seed, /identifiersRedacted:\s*true/u, PRODUCTION_FILES[2]);

  return Object.freeze({
    productionFiles: PRODUCTION_FILES.length,
    testFiles: TEST_FILES.length,
  });
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
      JSON.stringify({
        status: "verified",
        ...verifyTraderLinkPlatformDevelopmentOwnerSeedFiles(),
      }),
    );
  } catch (error) {
    console.error(
      JSON.stringify({
        code:
          error instanceof Error
            ? error.message
            : "TRADERLINK_DEVELOPMENT_OWNER_SEED_FILE_VERIFICATION_FAILED",
      }),
    );
    process.exitCode = 1;
  }
}
