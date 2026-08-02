import { createHash } from "node:crypto";

import type { PreservedCsvRecord } from "../../contracts/journal-import-contracts";
import { platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";

function sha256(value: string | Uint8Array): string {
  return createHash("sha256").update(value).digest("hex");
}

function finishRecord(
  records: Array<{ fields: readonly string[]; rawRecord: string }>,
  fields: string[], field: string, rawRecord: string,
): void {
  records.push(Object.freeze({ fields: Object.freeze([...fields, field]), rawRecord }));
}

/** Parse comma-separated records without converting values or dropping rows. */
export function parseRecordPreservingCsv(csvText: string): readonly PreservedCsvRecord[] {
  if (csvText.length === 0) return Object.freeze([]);
  if (Buffer.byteLength(csvText, "utf8") > 64 * 1024 * 1024) {
    platformFailure("TRADERLINK_JOURNAL_IMPORT_PARSE_FAILED", {
      reason: "payload_too_large",
    });
  }
  const text = csvText.charCodeAt(0) === 0xfeff ? csvText.slice(1) : csvText;
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(text)) {
    platformFailure("TRADERLINK_JOURNAL_IMPORT_PARSE_FAILED", {
      reason: "unsafe_control_character",
    });
  }
  const parsed: Array<{ fields: readonly string[]; rawRecord: string }> = [];
  let fields: string[] = [];
  let field = "";
  let rawRecord = "";
  let inQuotes = false;
  let quotedFieldClosed = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (inQuotes) {
      rawRecord += character;
      if (character !== '"') field += character;
      else if (text[index + 1] === '"') {
        rawRecord += '"'; field += '"'; index += 1;
      } else { inQuotes = false; quotedFieldClosed = true; }
      if (field.length > 1024 * 1024) {
        platformFailure("TRADERLINK_JOURNAL_IMPORT_PARSE_FAILED", {
          reason: "field_size_exceeded",
          recordOrdinal: parsed.length + 1,
        });
      }
      continue;
    }
    if (character === '"') {
      if (field.length !== 0 || quotedFieldClosed) {
        platformFailure("TRADERLINK_JOURNAL_IMPORT_PARSE_FAILED", { reason: "unexpected_quote", recordOrdinal: parsed.length + 1 });
      }
      inQuotes = true; rawRecord += character; continue;
    }
    if (character === ",") {
      if (fields.length >= 4096) {
        platformFailure("TRADERLINK_JOURNAL_IMPORT_PARSE_FAILED", {
          reason: "field_count_exceeded",
          recordOrdinal: parsed.length + 1,
        });
      }
      fields.push(field); field = ""; quotedFieldClosed = false; rawRecord += character; continue;
    }
    if (character === "\r" || character === "\n") {
      if (parsed.length >= 500_000) {
        platformFailure("TRADERLINK_JOURNAL_IMPORT_PARSE_FAILED", {
          reason: "record_count_exceeded",
        });
      }
      finishRecord(parsed, fields, field, rawRecord);
      fields = []; field = ""; rawRecord = ""; quotedFieldClosed = false;
      if (character === "\r" && text[index + 1] === "\n") index += 1;
      continue;
    }
    if (quotedFieldClosed) {
      platformFailure("TRADERLINK_JOURNAL_IMPORT_PARSE_FAILED", { reason: "characters_after_closing_quote", recordOrdinal: parsed.length + 1 });
    }
    field += character; rawRecord += character;
    if (field.length > 1024 * 1024) {
      platformFailure("TRADERLINK_JOURNAL_IMPORT_PARSE_FAILED", {
        reason: "field_size_exceeded",
        recordOrdinal: parsed.length + 1,
      });
    }
  }
  if (inQuotes) {
    platformFailure("TRADERLINK_JOURNAL_IMPORT_PARSE_FAILED", { reason: "unterminated_quote", recordOrdinal: parsed.length + 1 });
  }
  if (rawRecord.length > 0 || field.length > 0 || fields.length > 0) {
    if (parsed.length >= 500_000) {
      platformFailure("TRADERLINK_JOURNAL_IMPORT_PARSE_FAILED", {
        reason: "record_count_exceeded",
      });
    }
    finishRecord(parsed, fields, field, rawRecord);
  }

  const occurrenceCounts = new Map<string, number>();
  return Object.freeze(parsed.map((record, index) => {
    const rawFieldsJson = JSON.stringify(record.fields);
    const contentFingerprintSha256 = sha256(rawFieldsJson);
    const occurrenceOrdinal = (occurrenceCounts.get(contentFingerprintSha256) ?? 0) + 1;
    occurrenceCounts.set(contentFingerprintSha256, occurrenceOrdinal);
    return Object.freeze({
      recordOrdinal: index + 1, fields: record.fields, rawRecord: record.rawRecord,
      rawRecordSha256: sha256(record.rawRecord), rawFieldsJson,
      contentFingerprintSha256, occurrenceOrdinal,
    });
  }));
}

export function calculateSourceFileEvidence(
  bytes: Uint8Array,
): Readonly<{ sha256: string; sizeBytes: number }> {
  if (bytes.byteLength > 64 * 1024 * 1024) {
    platformFailure("TRADERLINK_JOURNAL_IMPORT_PARSE_FAILED", {
      reason: "payload_too_large",
    });
  }
  return Object.freeze({ sha256: sha256(bytes), sizeBytes: bytes.length });
}

export function decodeStrictUtf8Source(bytes: Uint8Array): string {
  calculateSourceFileEvidence(bytes);
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    platformFailure("TRADERLINK_JOURNAL_IMPORT_PARSE_FAILED", {
      reason: "unsupported_encoding",
    });
  }
}
