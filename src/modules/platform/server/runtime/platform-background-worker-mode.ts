import { createHash } from "node:crypto";
import { constants, closeSync, fstatSync, lstatSync, openSync, readFileSync, realpathSync } from "node:fs";

export const PLATFORM_BACKGROUND_WORKER_MODE_ENV = "TRADERLINK_PLATFORM_BACKGROUND_WORKERS_MODE";
export const PRIVATE_ACCEPTANCE_MARKER = "/data/private-acceptance.json";
export const PRIVATE_ACCEPTANCE_ARTIFACT = "/app/private-acceptance-artifact.json";
const buildIdPath = "/app/.next/BUILD_ID";
const prefix = "TRADERLINK_PLATFORM_PRIVATE_ACCEPTANCE_";
type Disposition = "enabled" | "disabled_private_acceptance" | "disabled_isolated_staging";

function refused(): never {
  throw Object.assign(new Error("Private acceptance boundary refused."), {
    code: "TRADERLINK_PLATFORM_PRIVATE_ACCEPTANCE_INVALID",
    safeContext: { stage: "background_worker_mode" },
  });
}

/** No database, provider or worker module is imported by this pre-write guard. */
function readBoundedFile(path: string, permissions?: number): string {
  let fd: number | undefined;
  try {
    const before = lstatSync(path);
    const uid = process.getuid?.();
    if (uid === undefined || !before.isFile() || before.isSymbolicLink()
      || before.nlink !== 1 || before.size < 1 || before.size > 8192
      || ![0, uid].includes(before.uid) || realpathSync(path) !== path
      || (before.mode & 0o022) !== 0
      || (permissions !== undefined && (before.mode & 0o777) !== permissions)) refused();
    fd = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW);
    const opened = fstatSync(fd);
    if (opened.dev !== before.dev || opened.ino !== before.ino
      || opened.size !== before.size || opened.mode !== before.mode
      || opened.uid !== before.uid || opened.nlink !== 1) refused();
    const value = readFileSync(fd, "utf8");
    if (Buffer.byteLength(value) !== opened.size) refused();
    return value;
  } catch {
    return refused();
  } finally {
    if (fd !== undefined) closeSync(fd);
  }
}

export const ISOLATED_STAGING_ARTIFACT = "/app/isolated-staging-artifact.json";
const stagingPrefix = "TRADERLINK_PLATFORM_ISOLATED_STAGING_";
const stagingTarget = Object.freeze({
  role: "community-combined-review",
  projectId: "49fc9197-07c9-45c7-b528-57d0393c2cca",
  environmentId: "9e079dd4-f3f3-4872-9b00-adbd3000c485",
  serviceId: "4d264aca-510c-4f5e-bc28-e89e526b8008",
  databasePath: "/data/community-combined-review-20261117/platform.sqlite",
});

/** The staging controller builds the immutable receipt and initializes/verifies
 * the synthetic database before this application starts. This guard grants no
 * migration, provider or authentication authority. */
function isolatedStagingMode(environment: NodeJS.ProcessEnv): Disposition {
  try {
    if (environment.NODE_ENV !== "production" || process.cwd() !== "/app"
      || environment.RAILWAY_PROJECT_ID !== stagingTarget.projectId
      || environment.RAILWAY_ENVIRONMENT_ID !== stagingTarget.environmentId
      || environment.RAILWAY_SERVICE_ID !== stagingTarget.serviceId
      || environment.TRADERLINK_PLATFORM_DB_PATH !== stagingTarget.databasePath
      || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(environment.RAILWAY_DEPLOYMENT_ID ?? "")
      || Object.keys(environment).some(key => key.startsWith(prefix) && environment[key] !== undefined)
      || environment.TRADERLINK_PLATFORM_MAINTENANCE_MIGRATION_ID !== undefined
      || environment.TRADERLINK_PLATFORM_MAINTENANCE_CONFIRM !== undefined) refused();
    const expected = {
      ...stagingTarget,
      sourceCommit: environment[`${stagingPrefix}SOURCE_COMMIT`],
      sourceVectorSha256: environment[`${stagingPrefix}SOURCE_VECTOR_SHA256`],
      schemaSha256: environment[`${stagingPrefix}SCHEMA_SHA256`],
      buildId: environment[`${stagingPrefix}BUILD_ID`],
    };
    const artifactHash = environment[`${stagingPrefix}ARTIFACT_SHA256`];
    if (!/^[0-9a-f]{40}$/.test(expected.sourceCommit ?? "")
      || !/^[0-9a-f]{64}$/.test(expected.sourceVectorSha256 ?? "")
      || !/^[0-9a-f]{64}$/.test(expected.schemaSha256 ?? "")
      || !/^[0-9a-f]{64}$/.test(artifactHash ?? "")
      || !/^[A-Za-z0-9_-]{1,128}$/.test(expected.buildId ?? "")) refused();
    const bytes = readBoundedFile(ISOLATED_STAGING_ARTIFACT, 0o444);
    if (createHash("sha256").update(bytes).digest("hex") !== artifactHash) refused();
    const artifact = JSON.parse(bytes);
    if (artifact?.kind !== "traderlink-isolated-staging-artifact-v1") refused();
    for (const [key, value] of Object.entries(expected)) {
      if (artifact[key] !== value) refused();
    }
    if (readBoundedFile(buildIdPath).trim() !== expected.buildId) refused();
    return "disabled_isolated_staging";
  } catch {
    throw Object.assign(new Error("Isolated staging boundary refused."), {
      code: "TRADERLINK_PLATFORM_ISOLATED_STAGING_INVALID",
      safeContext: { stage: "background_worker_mode" },
    });
  }
}

/** Resolve before migration maintenance. Normal hosted configuration never reads
 * a private marker; a requested private mode must qualify completely or abort. */
export function resolvePlatformBackgroundWorkerMode(
  environment: NodeJS.ProcessEnv = process.env,
): Disposition {
  const mode = environment[PLATFORM_BACKGROUND_WORKER_MODE_ENV];
  if (mode === undefined || mode === "enabled") return "enabled";
  if (mode === "disabled_isolated_staging") return isolatedStagingMode(environment);
  if (mode !== "disabled_private_acceptance") refused();
  if (environment.NODE_ENV !== "production" || environment.HOSTNAME !== "127.0.0.1"
    || environment.PORT !== "3010" || process.cwd() !== "/app"
    || environment.TRADERLINK_PLATFORM_DB_PATH !== "/data/traderlink-platform.sqlite"
    || environment[`${prefix}MARKER`] !== PRIVATE_ACCEPTANCE_MARKER
    || ["RAILWAY_PROJECT_ID", "RAILWAY_SERVICE_ID", "RAILWAY_ENVIRONMENT_ID", "RAILWAY_DEPLOYMENT_ID"]
      .some(key => environment[key] !== undefined)) refused();

  const expected = {
    runId: environment[`${prefix}RUN_ID`],
    candidateSha256: environment[`${prefix}CANDIDATE_SHA256`],
    manifestSha256: environment[`${prefix}MANIFEST_SHA256`],
    buildId: environment[`${prefix}BUILD_ID`],
  };
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(expected.runId ?? "")
    || !/^[0-9a-f]{64}$/.test(expected.candidateSha256 ?? "")
    || !/^[0-9a-f]{64}$/.test(expected.manifestSha256 ?? "")
    || !/^[A-Za-z0-9_-]{1,128}$/.test(expected.buildId ?? "")) refused();

  try {
    const marker = JSON.parse(readBoundedFile(PRIVATE_ACCEPTANCE_MARKER, 0o600));
    // A separate read-only artifact receipt is created by the lane controller
    // after the build. It is never generated by the running application.
    const artifact = JSON.parse(readBoundedFile(PRIVATE_ACCEPTANCE_ARTIFACT, 0o444));
    if (marker?.kind !== "traderlink-compiled-acceptance-v1"
      || artifact?.kind !== "traderlink-compiled-artifact-v1") refused();
    for (const [key, value] of Object.entries(expected)) {
      if (marker[key] !== value || (key !== "runId" && artifact[key] !== value)) refused();
    }
    if (readBoundedFile(buildIdPath).trim() !== expected.buildId) refused();
  } catch {
    return refused();
  }
  return "disabled_private_acceptance";
}
