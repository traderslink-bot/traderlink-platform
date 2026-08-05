import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
} from "node:crypto";

import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";
import type { JournalPrivacyHmacConfiguration } from "../imports/journal-import-service";

export type JournalOpaqueReferenceKind =
  | "import_attempt"
  | "import_batch"
  | "support_consent";

const TOKEN = /^jref1\.([a-z][a-z0-9_-]{0,63})\.([A-Za-z0-9_-]{16})\.([A-Za-z0-9_-]{1,512})\.([A-Za-z0-9_-]{22})$/u;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;
const AAD = Buffer.from("traderlink-journal-opaque-reference-v1", "utf8");

function key(configuration: JournalPrivacyHmacConfiguration, version: string): Buffer {
  const encoded = configuration.keysBase64[version];
  if (!encoded) platformFailure("TRADERLINK_JOURNAL_IMPORT_CONFLICT", {
    reason: "opaque_reference_key",
  });
  return createHmac("sha256", Buffer.from(encoded, "base64"))
    .update("traderlink-journal-opaque-reference-key-v1", "utf8")
    .digest();
}

function canonicalBase64Url(value: string): Buffer {
  const decoded = Buffer.from(value, "base64url");
  if (decoded.toString("base64url") !== value) {
    platformFailure("TRADERLINK_JOURNAL_IMPORT_CONFLICT", {
      reason: "opaque_reference_encoding",
    });
  }
  return decoded;
}

export function issueJournalOpaqueReference(input: Readonly<{
  configuration: JournalPrivacyHmacConfiguration;
  scope: WorkspaceAccessScope;
  kind: JournalOpaqueReferenceKind;
  internalId: string;
}>): string {
  const accountId = input.scope.activeAccountId;
  if (!accountId || !UUID.test(input.internalId)) {
    platformFailure("TRADERLINK_JOURNAL_IMPORT_CONFLICT", {
      reason: "opaque_reference_input",
    });
  }
  const version = input.configuration.activeKeyVersion;
  const initializationVector = randomBytes(12);
  const cipher = createCipheriv(
    "aes-256-gcm",
    key(input.configuration, version),
    initializationVector,
  );
  cipher.setAAD(AAD);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify([
      "journal_opaque_reference_v1",
      input.kind,
      input.scope.userId,
      input.scope.workspaceId,
      accountId,
      input.internalId,
    ]), "utf8"),
    cipher.final(),
  ]);
  return [
    "jref1",
    version,
    initializationVector.toString("base64url"),
    encrypted.toString("base64url"),
    cipher.getAuthTag().toString("base64url"),
  ].join(".");
}

export function resolveJournalOpaqueReference(input: Readonly<{
  configuration: JournalPrivacyHmacConfiguration;
  scope: WorkspaceAccessScope;
  kind: JournalOpaqueReferenceKind;
  reference: string;
}>): string {
  const match = TOKEN.exec(input.reference);
  const accountId = input.scope.activeAccountId;
  if (!match || !accountId) platformFailure("TRADERLINK_JOURNAL_IMPORT_CONFLICT", {
    reason: "opaque_reference_invalid",
  });
  try {
    const decipher = createDecipheriv(
      "aes-256-gcm",
      key(input.configuration, match[1]!),
      canonicalBase64Url(match[2]!),
    );
    decipher.setAAD(AAD);
    decipher.setAuthTag(canonicalBase64Url(match[4]!));
    const parsed: unknown = JSON.parse(Buffer.concat([
      decipher.update(canonicalBase64Url(match[3]!)),
      decipher.final(),
    ]).toString("utf8"));
    if (!Array.isArray(parsed) || parsed.length !== 6 ||
      parsed[0] !== "journal_opaque_reference_v1" ||
      parsed[1] !== input.kind || parsed[2] !== input.scope.userId ||
      parsed[3] !== input.scope.workspaceId || parsed[4] !== accountId ||
      typeof parsed[5] !== "string" || !UUID.test(parsed[5])) {
      platformFailure("TRADERLINK_JOURNAL_IMPORT_CONFLICT", {
        reason: "opaque_reference_scope",
      });
    }
    return parsed[5];
  } catch {
    platformFailure("TRADERLINK_JOURNAL_IMPORT_CONFLICT", {
      reason: "opaque_reference_invalid",
    });
  }
}
