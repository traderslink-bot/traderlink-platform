import "server-only";

import type Database from "better-sqlite3";

import type { JournalAdminScope } from "@/src/modules/platform/contracts/journal-admin-scope";
import { withJournalAdminDatabase } from "@/src/modules/platform/server/administration/platform-admin-authorization";
import { journalAdminPrivateHeaders } from "@/src/modules/platform/server/administration/platform-admin-request-security";
import { isTraderLinkPlatformError, platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";

export function journalAdminJson(
  body: unknown,
  status = 200,
): Response {
  return Response.json(body, {
    status,
    headers: journalAdminPrivateHeaders({
      "content-security-policy": "default-src 'none'; frame-ancestors 'none'",
    }),
  });
}

export function journalAdminUnavailable(error: unknown): Response {
  const code = isTraderLinkPlatformError(error)
    ? error.code
    : "TRADERLINK_JOURNAL_ADMIN_ACCESS_DENIED";
  const status = code === "TRADERLINK_JOURNAL_ADMIN_RATE_LIMITED"
    ? 429
    : code === "TRADERLINK_JOURNAL_ADMIN_AUTHORITY_CONFLICT"
      ? 409
    : code === "TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED" ||
        code === "TRADERLINK_JOURNAL_ADMIN_MUTATION_INVALID"
      ? 400
      : code === "TRADERLINK_JOURNAL_ADMIN_ACCESS_DENIED"
        ? 403
        : 503;
  return journalAdminJson({ status: "unavailable", code }, status);
}

export function journalAdminPageSizeFromUrl(url: URL): number | undefined {
  const raw = url.searchParams.get("pageSize");
  if (raw === null) return undefined;
  if (!/^[1-9][0-9]{0,2}$/u.test(raw)) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
      field: "pageSize",
    });
  }
  return Number(raw);
}

export function withJournalAdminRequest<T>(
  request: Request,
  operation: (
    database: Database.Database,
    scope: JournalAdminScope,
  ) => T,
): T {
  return withJournalAdminDatabase(request.headers, operation);
}

export function optionalBoolean(
  value: string | null,
  field: string,
): boolean | undefined {
  if (value === null) return undefined;
  if (value === "true") return true;
  if (value === "false") return false;
  platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field });
}
