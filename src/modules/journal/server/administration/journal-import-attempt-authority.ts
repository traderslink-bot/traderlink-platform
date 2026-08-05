import { createHmac } from "node:crypto";

import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";
import type { JournalPrivacyHmacConfiguration } from "../imports/journal-import-service";

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;

function activeKey(configuration: JournalPrivacyHmacConfiguration): Buffer {
  const encoded = configuration.keysBase64[configuration.activeKeyVersion];
  if (!encoded) platformFailure("TRADERLINK_JOURNAL_PRIVACY_CONFIGURATION_INVALID");
  const key = Buffer.from(encoded, "base64");
  if (key.length < 32 || key.toString("base64") !== encoded) {
    platformFailure("TRADERLINK_JOURNAL_PRIVACY_CONFIGURATION_INVALID");
  }
  return key;
}

export function deriveJournalImportAttemptDigests(input: Readonly<{
  configuration: JournalPrivacyHmacConfiguration;
  scope: WorkspaceAccessScope;
  browserIdempotencyRef: string;
}>): Readonly<{
  requestIdempotencySha256: string;
  correlationRefSha256: string;
}> {
  const accountId = input.scope.activeAccountId;
  if (!accountId) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
  if (!UUID_V4.test(input.browserIdempotencyRef)) {
    platformFailure("TRADERLINK_JOURNAL_IMPORT_CONFLICT", {
      reason: "attempt_idempotency_ref_invalid",
    });
  }
  const key = activeKey(input.configuration);
  const base = [
    input.scope.userId,
    input.scope.workspaceId,
    accountId,
    input.browserIdempotencyRef,
  ].join("\u001f");
  const digest = (purpose: string): string => createHmac("sha256", key)
    .update(["traderlink-journal-import-attempt-v1", purpose, base].join("\u001f"), "utf8")
    .digest("hex");
  return Object.freeze({
    requestIdempotencySha256: digest("idempotency"),
    correlationRefSha256: digest("correlation"),
  });
}
