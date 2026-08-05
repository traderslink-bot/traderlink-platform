import "server-only";

import { createHash } from "node:crypto";
import type Database from "better-sqlite3";

import type { JournalAdminScope } from "@/src/modules/platform/contracts/journal-admin-scope";
import { PlatformAdminAuditRepository } from "@/src/modules/platform/server/administration/platform-admin-audit-repository";
import { platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";
import {
  assertJournalMappingSupportPackageV2Privacy,
  type JournalMappingSupportPackageV2,
} from "../product/journal-mapping-support-package";

export type JournalDeveloperPackageResult = Readonly<{
  bytes: Uint8Array;
  contentType: "application/zip";
  filename: string;
  replayed: boolean;
}>;

type CandidateRow = Readonly<{
  statement_layout_sha256: string;
  canonical_safe_broker_label: string | null;
  file_kind: string;
  normalized_encoding: string;
  delimiter: string | null;
  current_state: string;
  revision: number;
  deployed_adapter_id: string | null;
  deployed_adapter_version: string | null;
}>;

type ObservationRow = Readonly<{
  sanitized_structure_json: string;
  mapping_contract_json: string | null;
  observation_outcome: string;
  safe_broker_label: string | null;
  package_version: string;
  parser_version: string | null;
  mapping_version: string | null;
}>;

const ENTRIES = Object.freeze([
  "manifest.json",
  "structure.json",
  "candidate-mappings.json",
  "fixture-skeleton.csv",
  "README.md",
]);
const MAX_ENTRY_BYTES = 512_000;
const MAX_ARCHIVE_BYTES = 2_000_000;
const UUID = /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/iu;
const EMAIL = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/iu;
const PATH = /(?:[A-Za-z]:\\|\\\\|\/(?:Users|home|var|tmp)\/)/u;
const FORBIDDEN_KEYS = /"(?:sourceFileSha256|sourceFileSizeBytes|sourcePath|originalFilename|rawRows|rawValues|userId|workspaceId|accountId|importAttemptId|importBatchId|discordSubject|email)"/u;

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function targetDigest(candidateId: string): string {
  return sha256(`journal-admin-target-v1\u001fstatement_format\u001f${candidateId}`);
}

function parseStructure(value: string): JournalMappingSupportPackageV2 {
  try {
    const parsed = JSON.parse(value) as JournalMappingSupportPackageV2;
    assertJournalMappingSupportPackageV2Privacy(parsed);
    if (parsed.privacy.privacyReviewRequired) throw new Error();
    return parsed;
  } catch (error) {
    platformFailure("TRADERLINK_JOURNAL_ADMIN_AUTHORITY_CONFLICT", {}, error);
  }
}

function privacySafeMapping(value: string | null): unknown | null {
  if (value === null) return null;
  try {
    const parsed: unknown = JSON.parse(value);
    const serialized = JSON.stringify(parsed);
    if (serialized.length > 50_000 || FORBIDDEN_KEYS.test(serialized) ||
      UUID.test(serialized) || EMAIL.test(serialized) || PATH.test(serialized) ||
      /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(serialized)) {
      throw new Error();
    }
    return parsed;
  } catch (error) {
    platformFailure("TRADERLINK_JOURNAL_ADMIN_AUTHORITY_CONFLICT", {}, error);
  }
}

function json(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function csvCell(value: string): string {
  return `"${value.replaceAll('"', '""')}"`;
}

function placeholder(field: string | undefined): string {
  if (field === "symbol") return "SYMBOL";
  if (field === "date") return "YYYY-MM-DD";
  if (field === "time") return "HH:MM:SS";
  if (field === "timestamp") return "YYYY-MM-DD HH:MM:SS";
  if (field === "side") return "Buy";
  if (["quantity", "price", "fees"].includes(field ?? "")) return "0.00";
  if (field === "currency") return "USD";
  if (field === "executionId") return "EXAMPLE-ID";
  return "VALUE";
}

function fixtureSkeleton(structure: JournalMappingSupportPackageV2): string {
  const blocks = structure.tables.map((table) => {
    const mappedByHeader = new Map(
      Object.entries(table.suggestedMapping).map(([field, header]) => [header, field]),
    );
    return [
      csvCell(`Section ${table.ordinal}: ${table.tableLabel}`),
      table.headerLabels.map(csvCell).join(","),
      table.headerLabels.map((header) =>
        csvCell(placeholder(mappedByHeader.get(header)))).join(","),
    ].join("\n");
  });
  return `${blocks.join("\n\n")}\n`;
}

let crcTable: Uint32Array | null = null;
function crc32(bytes: Uint8Array): number {
  if (!crcTable) {
    crcTable = new Uint32Array(256);
    for (let index = 0; index < 256; index += 1) {
      let value = index;
      for (let bit = 0; bit < 8; bit += 1) {
        value = (value & 1) !== 0
          ? 0xedb88320 ^ (value >>> 1)
          : value >>> 1;
      }
      crcTable[index] = value >>> 0;
    }
  }
  let value = 0xffffffff;
  for (const byte of bytes) {
    value = crcTable[(value ^ byte) & 0xff]! ^ (value >>> 8);
  }
  return (value ^ 0xffffffff) >>> 0;
}

function createZip(files: Readonly<Record<string, string>>): Uint8Array {
  if (Object.keys(files).length !== ENTRIES.length ||
    ENTRIES.some((name) => !(name in files))) {
    platformFailure("TRADERLINK_JOURNAL_ADMIN_AUTHORITY_CONFLICT");
  }
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;
  let total = 0;
  for (const name of ENTRIES) {
    const nameBytes = Buffer.from(name, "utf8");
    const data = Buffer.from(files[name]!, "utf8");
    if (data.byteLength > MAX_ENTRY_BYTES) {
      platformFailure("TRADERLINK_JOURNAL_ADMIN_AUTHORITY_CONFLICT");
    }
    total += data.byteLength;
    if (total > MAX_ARCHIVE_BYTES) {
      platformFailure("TRADERLINK_JOURNAL_ADMIN_AUTHORITY_CONFLICT");
    }
    const checksum = crc32(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6);
    local.writeUInt16LE(0, 8);
    local.writeUInt32LE(checksum, 14);
    local.writeUInt32LE(data.byteLength, 18);
    local.writeUInt32LE(data.byteLength, 22);
    local.writeUInt16LE(nameBytes.byteLength, 26);
    localParts.push(local, nameBytes, data);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt32LE(checksum, 16);
    central.writeUInt32LE(data.byteLength, 20);
    central.writeUInt32LE(data.byteLength, 24);
    central.writeUInt16LE(nameBytes.byteLength, 28);
    central.writeUInt32LE(offset, 42);
    centralParts.push(central, nameBytes);
    offset += local.byteLength + nameBytes.byteLength + data.byteLength;
  }
  const centralOffset = offset;
  const centralSize = centralParts.reduce((sum, part) => sum + part.byteLength, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(ENTRIES.length, 8);
  end.writeUInt16LE(ENTRIES.length, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(centralOffset, 16);
  const archive = Buffer.concat([...localParts, ...centralParts, end]);
  if (archive.byteLength > MAX_ARCHIVE_BYTES) {
    platformFailure("TRADERLINK_JOURNAL_ADMIN_AUTHORITY_CONFLICT");
  }
  return archive;
}

function assertPackagePrivacy(files: Readonly<Record<string, string>>): void {
  const serialized = ENTRIES.map((name) => files[name]).join("\n");
  if (FORBIDDEN_KEYS.test(serialized) || UUID.test(serialized) ||
    EMAIL.test(serialized) || PATH.test(serialized) ||
    /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(serialized)) {
    platformFailure("TRADERLINK_JOURNAL_ADMIN_AUTHORITY_CONFLICT");
  }
}

export class JournalDeveloperPackageService {
  constructor(private readonly input: Readonly<{
    database: Database.Database;
    scope: JournalAdminScope;
  }>) {}

  create(input: Readonly<{
    candidateId: string;
    candidateRef: string;
    expectedRevision: number;
    correlationRefSha256: string;
    timestamp: string;
  }>): JournalDeveloperPackageResult {
    if (!Number.isSafeInteger(input.expectedRevision) || input.expectedRevision < 1) {
      platformFailure("TRADERLINK_JOURNAL_ADMIN_MUTATION_INVALID");
    }
    const operation = () => {
      const candidate = this.input.database.prepare<[string], CandidateRow>(`SELECT
 statement_layout_sha256, canonical_safe_broker_label, file_kind,
 normalized_encoding, delimiter, current_state, revision,
 deployed_adapter_id, deployed_adapter_version
FROM journal_statement_format_candidates
WHERE statement_format_candidate_id = ?`).get(input.candidateId);
      if (!candidate || candidate.revision !== input.expectedRevision) {
        platformFailure("TRADERLINK_JOURNAL_ADMIN_AUTHORITY_CONFLICT");
      }
      const rows = this.input.database.prepare<[string], ObservationRow>(`SELECT
 observation.sanitized_structure_json, observation.mapping_contract_json,
 observation.observation_outcome, observation.safe_broker_label,
 observation.package_version, attempt.parser_version, attempt.mapping_version
FROM journal_statement_format_observations observation
LEFT JOIN journal_import_attempts attempt
  ON attempt.import_attempt_id = observation.import_attempt_id
WHERE observation.statement_format_candidate_id = ?
ORDER BY observation.created_at_utc, observation.statement_format_observation_id
LIMIT 250`).all(input.candidateId);
      if (rows.length < 1) {
        platformFailure("TRADERLINK_JOURNAL_ADMIN_AUTHORITY_CONFLICT");
      }
      const structures = rows.map((row) => parseStructure(row.sanitized_structure_json));
      if (structures.some((structure) =>
        structure.statementLayoutSignatureSha256 !== candidate.statement_layout_sha256)) {
        platformFailure("TRADERLINK_JOURNAL_ADMIN_AUTHORITY_CONFLICT");
      }
      const structureJson = structures.map((structure) => Object.freeze({
        contractVersion: structure.contractVersion,
        fileKind: structure.fileKind,
        detectedEncoding: structure.detectedEncoding,
        detectedDelimiter: structure.detectedDelimiter,
        recordFieldCounts: structure.recordFieldCounts,
        tables: structure.tables,
        statementLayoutSignatureSha256: structure.statementLayoutSignatureSha256,
        failureCategory: structure.failureCategory,
        privacy: structure.privacy,
      }));
      const mappingCounts = new Map<string, { mapping: unknown; count: number }>();
      for (const row of rows) {
        const mapping = privacySafeMapping(row.mapping_contract_json);
        if (mapping === null) continue;
        const key = JSON.stringify(mapping);
        const current = mappingCounts.get(key);
        mappingCounts.set(key, { mapping, count: (current?.count ?? 0) + 1 });
      }
      const brokerLabels = [...new Set(rows.map((row) => row.safe_broker_label)
        .filter((label): label is string => Boolean(label)))].sort();
      const outcomes = Object.fromEntries([...new Set(rows.map((row) => row.observation_outcome))]
        .sort().map((outcome) => [
          outcome,
          rows.filter((row) => row.observation_outcome === outcome).length,
        ]));
      const files = Object.freeze({
        "manifest.json": json({
          packageVersion: "journal_developer_package_v1",
          candidateRef: input.candidateRef,
          safeBrokerLabels: brokerLabels,
          observationCount: rows.length,
          packageVersions: [...new Set(rows.map((row) => row.package_version))].sort(),
          parserVersions: [...new Set(rows.map((row) => row.parser_version)
            .filter((value): value is string => Boolean(value)))].sort(),
          mappingVersions: [...new Set(rows.map((row) => row.mapping_version)
            .filter((value): value is string => Boolean(value)))].sort(),
          failureCategories: [...new Set(structures.map((item) => item.failureCategory))].sort(),
          observationOutcomes: outcomes,
          lifecycleState: candidate.current_state,
          revision: candidate.revision,
          deployedAdapter: candidate.deployed_adapter_id === null
            ? null
            : {
                id: candidate.deployed_adapter_id,
                version: candidate.deployed_adapter_version,
              },
        }),
        "structure.json": json({ observations: structureJson }),
        "candidate-mappings.json": json({
          variants: [...mappingCounts.values()].map((item) => ({
            mapping: item.mapping,
            observationCount: item.count,
            conflict: mappingCounts.size > 1,
          })),
        }),
        "fixture-skeleton.csv": fixtureSkeleton(structures[0]!),
        "README.md": [
          "# TraderLink importer development package",
          "",
          "This package contains privacy-safe statement structure and synthetic placeholders only.",
          "It does not contain statement values, filenames, account identities, user notes or authentication data.",
          "",
          "Use the exact layout and table signatures to implement a code-owned adapter and synthetic fixture.",
          "Verify parsing, mapping, reconstruction, privacy and the deployed registry before marking the format supported.",
          "",
        ].join("\n"),
      });
      assertPackagePrivacy(files);
      const bytes = createZip(files);

      const replay = this.input.database.prepare<[
        string,
        string,
        string,
      ], { found: number }>(`SELECT 1 AS found
FROM platform_admin_audit_events
WHERE actor_user_id = ? AND action = 'developer_package_created'
  AND target_ref_sha256 = ? AND correlation_ref_sha256 = ?
  AND outcome = 'success' LIMIT 1`).get(
        this.input.scope.userId,
        targetDigest(input.candidateId),
        input.correlationRefSha256,
      )?.found === 1;
      if (!replay) {
        new PlatformAdminAuditRepository(this.input.database).append({
          actorKind: "platform_user",
          actorUserId: this.input.scope.userId,
          actorRole: this.input.scope.role,
          action: "developer_package_created",
          targetKind: "statement_format",
          targetRefSha256: targetDigest(input.candidateId),
          outcome: "success",
          reasonCode: "importer_development",
          correlationRefSha256: input.correlationRefSha256,
          previewReceiptSha256: null,
          details: Object.freeze({
            package_version: "journal_developer_package_v1",
            revision: candidate.revision,
            entry_count: ENTRIES.length,
            byte_count: bytes.byteLength,
          }),
          createdAtUtc: input.timestamp,
        });
      }
      return Object.freeze({
        bytes,
        contentType: "application/zip" as const,
        filename: `journal-format-${sha256(input.candidateRef).slice(0, 16)}.zip`,
        replayed: replay,
      });
    };
    return this.input.database.inTransaction
      ? operation()
      : this.input.database.transaction(operation).immediate();
  }
}
