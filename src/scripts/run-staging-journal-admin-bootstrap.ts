import {
  existsSync,
  lstatSync,
  realpathSync,
  statSync,
} from "node:fs";
import { spawnSync } from "node:child_process";

const STAGING_ENVIRONMENT_NAME = "staging";
const VOLUME_ROOT = "/data";
const DATABASE_PATH = "/data/traderlink-platform.sqlite";

const LINK_SCRIPT = "src/scripts/manage-traderlink-initial-owner-discord-link.ts";
const GRANT_SCRIPT = "src/scripts/manage-traderlink-journal-admin-operator.ts";

type Operation = "link" | "grant";
type Mode = "preview" | "execute";

function fail(): never {
  throw new Error("TRADERLINK_STAGING_JOURNAL_ADMIN_BOOTSTRAP_INVALID");
}

function requireExactStagingRuntime(): void {
  if (
    process.env.RAILWAY_ENVIRONMENT_NAME !== STAGING_ENVIRONMENT_NAME ||
    process.env.TRADERLINK_PLATFORM_DB_PATH !== DATABASE_PATH ||
    !existsSync(VOLUME_ROOT) ||
    lstatSync(VOLUME_ROOT).isSymbolicLink() ||
    realpathSync(VOLUME_ROOT) !== VOLUME_ROOT
  ) fail();

  const volume = statSync(VOLUME_ROOT);
  const processUserId = process.getuid?.();
  const processGroupId = process.getgid?.();
  if (
    processUserId === undefined ||
    processGroupId === undefined ||
    volume.uid !== processUserId ||
    volume.gid !== processGroupId
  ) fail();

  if (
    !existsSync(DATABASE_PATH) ||
    lstatSync(DATABASE_PATH).isSymbolicLink() ||
    realpathSync(DATABASE_PATH) !== DATABASE_PATH ||
    !statSync(DATABASE_PATH).isFile()
  ) fail();
}

function parseOperation(): Readonly<{ operation: Operation; mode: Mode; forwarded: readonly string[] }> {
  const arguments_ = process.argv.slice(2);
  const [operation, mode, ...rest] = arguments_;
  if ((operation !== "link" && operation !== "grant") || (mode !== "--preview" && mode !== "--execute")) {
    fail();
  }
  if (mode === "--preview") {
    if (rest.length !== 0) fail();
    return Object.freeze({ operation, mode: "preview" as const, forwarded: Object.freeze([]) });
  }
  if (rest.length !== 2) fail();
  const expectedPreviewDigest = rest.find((value) => value.startsWith("--expected-preview-digest="));
  const confirmation = rest.find((value) => value.startsWith("--confirm="));
  if (
    !expectedPreviewDigest ||
    !confirmation ||
    expectedPreviewDigest.length === "--expected-preview-digest=".length ||
    confirmation.length === "--confirm=".length ||
    new Set(rest).size !== 2
  ) fail();
  return Object.freeze({
    operation,
    mode: "execute" as const,
    forwarded: Object.freeze(["--execute", expectedPreviewDigest, confirmation]),
  });
}

function commandFor(operation: Operation, mode: Mode, forwarded: readonly string[]): Readonly<{ script: string; arguments_: readonly string[] }> {
  if (operation === "link") {
    return Object.freeze({
      script: LINK_SCRIPT,
      arguments_: mode === "preview" ? ["--preview"] : forwarded,
    });
  }
  return Object.freeze({
    script: GRANT_SCRIPT,
    arguments_: mode === "preview"
      ? ["--operation=grant", "--target=configured-initial-owner", "--preview"]
      : ["--operation=grant", "--target=configured-initial-owner", ...forwarded],
  });
}

function main(): void {
  requireExactStagingRuntime();
  const request = parseOperation();
  const command = commandFor(request.operation, request.mode, request.forwarded);
  const result = spawnSync(
    process.execPath,
    ["./node_modules/tsx/dist/cli.mjs", command.script, ...command.arguments_],
    { cwd: process.cwd(), env: process.env, shell: false, stdio: "inherit" },
  );
  if (result.error || result.status !== 0) {
    process.exitCode = result.status ?? 1;
  }
}

try {
  main();
} catch (error) {
  process.stderr.write(`${JSON.stringify({
    status: "failed",
    code: error instanceof Error
      ? error.message
      : "TRADERLINK_STAGING_JOURNAL_ADMIN_BOOTSTRAP_INVALID",
  })}\n`);
  process.exitCode = 1;
}
