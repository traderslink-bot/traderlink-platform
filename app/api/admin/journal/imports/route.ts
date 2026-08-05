import type { JournalAdminImportListItem } from "@/src/modules/journal/contracts/journal-administration-contracts";
import { JournalAdminImportService } from "@/src/modules/journal/server/administration/journal-admin-import-service";
import { platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";
import {
  journalAdminJson,
  journalAdminPageSizeFromUrl,
  journalAdminUnavailable,
  optionalBoolean,
  withJournalAdminRequest,
} from "../admin-route-runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAPPING_ORIGINS = new Set<JournalAdminImportListItem["mappingOrigin"]>([
  "verified_adapter",
  "saved_account_template",
  "manual_map",
  "unavailable",
]);

export function GET(request: Request): Response {
  try {
    const url = new URL(request.url);
    const mappingOrigin = url.searchParams.get("mappingOrigin");
    if (mappingOrigin !== null &&
      !MAPPING_ORIGINS.has(mappingOrigin as JournalAdminImportListItem["mappingOrigin"])) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
        field: "mappingOrigin",
      });
    }
    return withJournalAdminRequest(request, (database, scope) =>
      journalAdminJson({
        status: "ready",
        imports: new JournalAdminImportService({ database, scope }).list({
          cursor: url.searchParams.get("cursor"),
          pageSize: journalAdminPageSizeFromUrl(url),
          filters: {
            state: url.searchParams.get("state") ?? undefined,
            brokerLabel: url.searchParams.get("brokerLabel") ?? undefined,
            formatRef: url.searchParams.get("formatRef") ?? undefined,
            userRef: url.searchParams.get("userRef") ?? undefined,
            accountRef: url.searchParams.get("accountRef") ?? undefined,
            mappingOrigin: mappingOrigin as JournalAdminImportListItem["mappingOrigin"] | null ?? undefined,
            hasUnresolvedDecisions: optionalBoolean(
              url.searchParams.get("hasUnresolvedDecisions"),
              "hasUnresolvedDecisions",
            ),
            developerPackageAvailable: optionalBoolean(
              url.searchParams.get("developerPackageAvailable"),
              "developerPackageAvailable",
            ),
            consentedSourceAvailable: optionalBoolean(
              url.searchParams.get("consentedSourceAvailable"),
              "consentedSourceAvailable",
            ),
            submittedAfterUtc: url.searchParams.get("submittedAfterUtc") ?? undefined,
            submittedBeforeUtc: url.searchParams.get("submittedBeforeUtc") ?? undefined,
          },
        }),
      }));
  } catch (error) {
    return journalAdminUnavailable(error);
  }
}
