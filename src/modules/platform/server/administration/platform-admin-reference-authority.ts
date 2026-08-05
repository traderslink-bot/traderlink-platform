import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
} from "node:crypto";

import type { JournalAdminScope } from "../../contracts/journal-admin-scope";
import { platformFailure } from "../database/platform-migration-contract";

export type PlatformAdminReferenceKeyConfiguration = Readonly<{
  activeKeyVersion: string;
  keysBase64: Readonly<Record<string, string>>;
}>;

export type JournalAdminReferenceKind =
  | "user"
  | "account"
  | "import_attempt"
  | "import_batch"
  | "statement_format"
  | "format_observation"
  | "data_decision"
  | "audit_event"
  | "operational_event";

export type ResolvedJournalAdminReference = Readonly<{
  kind: JournalAdminReferenceKind;
  internalId: string;
}>;

const TOKEN = /^jadmin1\.([a-z][a-z0-9_]{0,63})\.([a-z][a-z0-9_-]{0,63})\.([A-Za-z0-9_-]{16})\.([A-Za-z0-9_-]{1,512})\.([A-Za-z0-9_-]{22})$/u;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;
const AAD = Buffer.from("traderlink-journal-admin-reference-v1", "utf8");

function key(
  configuration: PlatformAdminReferenceKeyConfiguration,
  version: string,
): Buffer {
  const encoded = configuration.keysBase64[version];
  if (!encoded) platformFailure("TRADERLINK_JOURNAL_ADMIN_ACCESS_DENIED");
  return createHmac("sha256", Buffer.from(encoded, "base64"))
    .update("traderlink-journal-admin-reference-key-v1", "utf8")
    .digest();
}

function canonicalBase64Url(value: string): Buffer {
  const decoded = Buffer.from(value, "base64url");
  if (decoded.toString("base64url") !== value) {
    platformFailure("TRADERLINK_JOURNAL_ADMIN_ACCESS_DENIED");
  }
  return decoded;
}

export function issueJournalAdminReference(input: Readonly<{
  configuration: PlatformAdminReferenceKeyConfiguration;
  scope: JournalAdminScope;
  kind: JournalAdminReferenceKind;
  internalId: string;
}>): string {
  if (!UUID.test(input.internalId)) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
      field: "adminReference",
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
      "journal_admin_reference_v1",
      input.scope.userId,
      input.scope.mode,
      input.kind,
      input.internalId,
    ]), "utf8"),
    cipher.final(),
  ]);
  return [
    "jadmin1",
    input.kind,
    version,
    initializationVector.toString("base64url"),
    encrypted.toString("base64url"),
    cipher.getAuthTag().toString("base64url"),
  ].join(".");
}

export function resolveJournalAdminReference(input: Readonly<{
  configuration: PlatformAdminReferenceKeyConfiguration;
  scope: JournalAdminScope;
  reference: string;
  expectedKinds?: readonly JournalAdminReferenceKind[];
}>): ResolvedJournalAdminReference {
  const match = TOKEN.exec(input.reference);
  if (!match) platformFailure("TRADERLINK_JOURNAL_ADMIN_ACCESS_DENIED");
  const visibleKind = match[1] as JournalAdminReferenceKind;
  if (
    input.expectedKinds &&
    !input.expectedKinds.includes(visibleKind)
  ) {
    platformFailure("TRADERLINK_JOURNAL_ADMIN_ACCESS_DENIED");
  }
  try {
    const decipher = createDecipheriv(
      "aes-256-gcm",
      key(input.configuration, match[2]!),
      canonicalBase64Url(match[3]!),
    );
    decipher.setAAD(AAD);
    decipher.setAuthTag(canonicalBase64Url(match[5]!));
    const parsed: unknown = JSON.parse(Buffer.concat([
      decipher.update(canonicalBase64Url(match[4]!)),
      decipher.final(),
    ]).toString("utf8"));
    if (
      !Array.isArray(parsed) ||
      parsed.length !== 5 ||
      parsed[0] !== "journal_admin_reference_v1" ||
      parsed[1] !== input.scope.userId ||
      parsed[2] !== input.scope.mode ||
      parsed[3] !== visibleKind ||
      typeof parsed[4] !== "string" ||
      !UUID.test(parsed[4])
    ) {
      platformFailure("TRADERLINK_JOURNAL_ADMIN_ACCESS_DENIED");
    }
    return Object.freeze({ kind: visibleKind, internalId: parsed[4] });
  } catch {
    platformFailure("TRADERLINK_JOURNAL_ADMIN_ACCESS_DENIED");
  }
}
