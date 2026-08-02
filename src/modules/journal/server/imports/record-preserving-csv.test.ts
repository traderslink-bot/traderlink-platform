import {
  calculateSourceFileEvidence,
  decodeStrictUtf8Source,
  parseRecordPreservingCsv,
} from "./record-preserving-csv";

describe("record-preserving CSV parser", () => {
  it("preserves headers, empty records, escaped quotes, embedded newlines, and duplicates", () => {
    const records = parseRecordPreservingCsv(
      'Section,Header,Value\r\nSection,Data,"one, two"\r\n\r\nSection,Data,"line 1\nline 2"\r\nSection,Data,"a ""quote"""\r\nSection,Data,duplicate\r\nSection,Data,duplicate\r\n',
    );
    expect(records).toHaveLength(7);
    expect(records[1].fields[2]).toBe("one, two");
    expect(records[2].fields).toEqual([""]);
    expect(records[3].fields[2]).toBe("line 1\nline 2");
    expect(records[4].fields[2]).toBe('a "quote"');
    expect(records[5].contentFingerprintSha256).toBe(records[6].contentFingerprintSha256);
    expect(records[5].occurrenceOrdinal).toBe(1);
    expect(records[6].occurrenceOrdinal).toBe(2);
    expect(records.map((record) => record.recordOrdinal)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("fails closed on malformed quote boundaries without returning source values", () => {
    expect(() => parseRecordPreservingCsv('A,Data,"unterminated')).toThrowError(
      "TRADERLINK_JOURNAL_IMPORT_PARSE_FAILED",
    );
    expect(() => parseRecordPreservingCsv('A,Data,"closed"tail')).toThrowError(
      "TRADERLINK_JOURNAL_IMPORT_PARSE_FAILED",
    );
  });

  it("rejects unsafe control characters without rejecting CSV line endings", () => {
    expect(() => parseRecordPreservingCsv("a,b\u0000c\r\n1,2"))
      .toThrowError("TRADERLINK_JOURNAL_IMPORT_PARSE_FAILED");
    expect(parseRecordPreservingCsv("a,b\r\n1,2\n")).toHaveLength(2);
  });

  it("hashes exact source bytes and rejects malformed UTF-8 before parsing", () => {
    const withBom = Uint8Array.from([0xef, 0xbb, 0xbf, 0x61, 0x2c, 0x62]);
    const withoutBom = Uint8Array.from([0x61, 0x2c, 0x62]);
    expect(calculateSourceFileEvidence(withBom).sha256)
      .not.toBe(calculateSourceFileEvidence(withoutBom).sha256);
    expect(decodeStrictUtf8Source(withBom)).toBe("a,b");
    expect(() => decodeStrictUtf8Source(Uint8Array.from([0xc3, 0x28])))
      .toThrowError("TRADERLINK_JOURNAL_IMPORT_PARSE_FAILED");
  });
});
