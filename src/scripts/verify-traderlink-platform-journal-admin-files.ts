import { existsSync, lstatSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ADMIN_PAGE_FILES = Object.freeze([
  "app/admin/journal/journal-admin-shell.tsx",
  "app/admin/journal/journal-admin-ui.tsx",
  "app/admin/journal/layout.tsx",
  "app/admin/journal/page.tsx",
  "app/admin/journal/audit/page.tsx",
  "app/admin/journal/data-decisions/page.tsx",
  "app/admin/journal/imports/import-detail-button.tsx",
  "app/admin/journal/imports/page.tsx",
  "app/admin/journal/statement-formats/page.tsx",
  "app/admin/journal/statement-formats/[formatRef]/page.tsx",
  "app/admin/journal/statement-formats/[formatRef]/statement-format-actions.tsx",
  "app/admin/journal/system/page.tsx",
  "app/admin/journal/users/page.tsx",
  "app/admin/journal/users/user-detail-button.tsx",
]);

const ADMIN_API_FILES = Object.freeze([
  "app/api/admin/journal/admin-route-runtime.ts",
  "app/api/admin/journal/audit/route.ts",
  "app/api/admin/journal/data-decisions/route.ts",
  "app/api/admin/journal/imports/route.ts",
  "app/api/admin/journal/imports/[importRef]/detail-access/route.ts",
  "app/api/admin/journal/imports/[importRef]/consented-source-download/route.ts",
  "app/api/admin/journal/overview/route.ts",
  "app/api/admin/journal/statement-formats/route.ts",
  "app/api/admin/journal/statement-formats/[formatRef]/route.ts",
  "app/api/admin/journal/statement-formats/[formatRef]/developer-package/route.ts",
  "app/api/admin/journal/statement-formats/[formatRef]/merge/route.ts",
  "app/api/admin/journal/statement-formats/[formatRef]/transition/route.ts",
  "app/api/admin/journal/system/route.ts",
  "app/api/admin/journal/users/route.ts",
  "app/api/admin/journal/users/[userRef]/detail-access/route.ts",
]);

const ADMIN_FOUNDATION_FILES = Object.freeze([
  "src/modules/platform/contracts/journal-admin-request.ts",
  "src/modules/platform/contracts/journal-admin-scope.ts",
  "src/modules/platform/server/database/migrations/0019_platform_administration.ts",
  "src/modules/journal/server/database/migrations/0020_journal_import_operations.ts",
  "src/modules/journal/contracts/journal-administration-contracts.ts",
  "src/modules/platform/server/administration/platform-admin-audit-repository.ts",
  "src/modules/platform/server/administration/platform-admin-audit-service.ts",
  "src/modules/platform/server/administration/platform-admin-authorization.ts",
  "src/modules/platform/server/administration/platform-admin-reference-authority.ts",
  "src/modules/platform/server/administration/platform-admin-request-security.ts",
  "src/modules/platform/server/administration/platform-admin-sensitive-access.ts",
  "src/modules/platform/server/administration/platform-admin-system-service.ts",
  "src/modules/platform/server/administration/platform-operational-event-repository.ts",
  "src/modules/platform/server/administration/platform-operator-repository.ts",
  "src/modules/platform/server/administration/platform-operator-service.ts",
  "src/modules/platform/server/administration/require-journal-admin-page.ts",
  "src/modules/journal/server/administration/journal-admin-decision-service.ts",
  "src/modules/journal/server/administration/journal-admin-import-service.ts",
  "src/modules/journal/server/administration/journal-admin-overview-service.ts",
  "src/modules/journal/server/administration/journal-admin-read-helpers.ts",
  "src/modules/journal/server/administration/journal-admin-user-service.ts",
  "src/modules/journal/server/administration/journal-consented-source-download-service.ts",
  "src/modules/journal/server/administration/journal-developer-package-service.ts",
  "src/modules/journal/server/administration/journal-import-attempt-authority.ts",
  "src/modules/journal/server/administration/journal-import-attempt-recovery.ts",
  "src/modules/journal/server/administration/journal-import-attempt-repository.ts",
  "src/modules/journal/server/administration/journal-import-attempt-service.ts",
  "src/modules/journal/server/administration/journal-opaque-reference-authority.ts",
  "src/modules/journal/server/administration/journal-statement-format-command-service.ts",
  "src/modules/journal/server/administration/journal-statement-format-repository.ts",
  "src/modules/journal/server/administration/journal-statement-format-service.ts",
  "src/modules/journal/server/administration/journal-supported-statement-format-registry.ts",
  "src/modules/journal/server/administration/journal-support-consent-repository.ts",
  "src/modules/journal/server/administration/journal-support-consent-service.ts",
  "src/modules/journal/server/administration/journal-support-source-vault.ts",
  "src/scripts/manage-traderlink-journal-admin-operator.ts",
  "docs/migration/journal-admin-dashboard-plan.md",
  "docs/migration/journal-admin-dashboard-progress.md",
]);

const FOCUSED_TEST_FILES = Object.freeze([
  "src/modules/platform/server/administration/platform-admin-authorization.test.ts",
  "src/modules/platform/server/administration/platform-admin-reference-authority.test.ts",
  "src/modules/platform/server/administration/platform-admin-request-security.test.ts",
  "src/modules/platform/server/administration/platform-operator-service.test.ts",
  "src/modules/journal/server/administration/journal-admin-read-services.test.ts",
  "src/modules/journal/server/administration/journal-import-attempt-authority.test.ts",
  "src/modules/journal/server/administration/journal-import-attempt-recovery.test.ts",
  "src/modules/journal/server/administration/journal-import-attempt-repository.test.ts",
  "src/modules/journal/server/administration/journal-import-attempt-service.test.ts",
  "src/modules/journal/server/administration/journal-opaque-reference-authority.test.ts",
  "src/modules/journal/server/administration/journal-statement-format-command-service.test.ts",
  "src/modules/journal/server/administration/journal-statement-format-repository.test.ts",
  "src/modules/journal/server/administration/journal-support-consent-repository.test.ts",
  "src/modules/journal/server/administration/journal-support-consent-service.test.ts",
  "src/modules/journal/server/administration/journal-support-source-vault.test.ts",
]);

const SCRIPT = "src/scripts/verify-traderlink-platform-journal-admin-files.ts";
const REQUIRED_FILES = Object.freeze([
  ...ADMIN_PAGE_FILES,
  ...ADMIN_API_FILES,
  ...ADMIN_FOUNDATION_FILES,
  ...FOCUSED_TEST_FILES,
  SCRIPT,
]);

function requireCondition(condition: boolean, check: string): void {
  if (!condition) throw new Error(`TRADERLINK_JOURNAL_ADMIN_FILE_VERIFICATION_FAILED:${check}`);
}

function source(repositoryRoot: string, path: string): string {
  const absolute = resolve(repositoryRoot, path);
  requireCondition(existsSync(absolute), `missing:${path}`);
  requireCondition(lstatSync(absolute).isFile(), `not_file:${path}`);
  return readFileSync(absolute, "utf8");
}

export function verifyTraderLinkPlatformJournalAdminFiles(
  repositoryRoot = process.cwd(),
): Readonly<{
  status: "verified";
  requiredFiles: number;
  adminPages: number;
  adminApis: number;
  foundationFiles: number;
  focusedTests: number;
}> {
  requireCondition(new Set(REQUIRED_FILES).size === REQUIRED_FILES.length,
    "duplicate_required_file");
  for (const path of REQUIRED_FILES) source(repositoryRoot, path);

  for (const path of [...ADMIN_PAGE_FILES, ...ADMIN_API_FILES, ...ADMIN_FOUNDATION_FILES]
    .filter((path) => /\.tsx?$/u.test(path))) {
    const content = source(repositoryRoot, path);
    requireCondition(!/trader-intelligence-v3|v4-temp-sql|trader_analytics/iu.test(content),
      `legacy_dependency:${path}`);
    requireCondition(!/(?:^|[^a-z0-9_])[a-z]:[\\/]|private-data|trading-rules-v1\.sqlite/imu
      .test(content), `private_path:${path}`);
  }

  for (const path of ADMIN_PAGE_FILES) {
    const content = source(repositoryRoot, path);
    if (content.startsWith('"use client"')) {
      requireCondition(!/\/server\//u.test(content), `client_server_import:${path}`);
    }
  }

  for (const path of ADMIN_API_FILES.filter((path) => path.endsWith("/route.ts"))) {
    const content = source(repositoryRoot, path);
    requireCondition(content.includes('export const runtime = "nodejs"'),
      `node_runtime:${path}`);
    requireCondition(content.includes('export const dynamic = "force-dynamic"'),
      `dynamic_route:${path}`);
    requireCondition(content.includes("journalAdminUnavailable"),
      `safe_error_response:${path}`);
  }

  for (const path of ADMIN_API_FILES.filter((path) =>
    /(?:detail-access|transition|merge|developer-package|consented-source-download)\/route\.ts$/u
      .test(path))) {
    const content = source(repositoryRoot, path);
    requireCondition(content.includes("requireJournalAdminMutationRequest"),
      `mutation_boundary:${path}`);
    requireCondition(content.includes("requireJournalAdminPermission"),
      `permission_boundary:${path}`);
  }

  const browserSurface = [...ADMIN_PAGE_FILES, ...ADMIN_API_FILES]
    .map((path) => source(repositoryRoot, path)).join("\n");
  requireCondition(!/source_file_sha256|source_file_size_bytes|evidence_object_key|object_key|auth_subject|discord_subject|workspace_id|account_id/iu
    .test(browserSurface), "browser_sensitive_field");
  requireCondition(source(repositoryRoot,
    "src/modules/journal/server/administration/journal-supported-statement-format-registry.ts")
    .includes("Object.freeze([])"), "code_owned_registry_default");
  const decisionPage = source(repositoryRoot,
    "app/admin/journal/data-decisions/page.tsx");
  requireCondition(!/fetch\(|method:\s*["']POST/iu.test(decisionPage),
    "admin_decision_mutation");

  return Object.freeze({
    status: "verified",
    requiredFiles: REQUIRED_FILES.length,
    adminPages: ADMIN_PAGE_FILES.length,
    adminApis: ADMIN_API_FILES.length,
    foundationFiles: ADMIN_FOUNDATION_FILES.length,
    focusedTests: FOCUSED_TEST_FILES.length,
  });
}

function isDirectExecution(): boolean {
  const invokedPath = process.argv[1];
  return Boolean(invokedPath) &&
    resolve(invokedPath!).toLowerCase() === fileURLToPath(import.meta.url).toLowerCase();
}

if (isDirectExecution()) {
  try {
    console.info(JSON.stringify(verifyTraderLinkPlatformJournalAdminFiles(), null, 2));
  } catch (error) {
    console.error(JSON.stringify({
      code: error instanceof Error
        ? error.message
        : "TRADERLINK_JOURNAL_ADMIN_FILE_VERIFICATION_FAILED",
    }));
    process.exitCode = 1;
  }
}
