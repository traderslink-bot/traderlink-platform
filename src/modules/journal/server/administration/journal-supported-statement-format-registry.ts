export type JournalSupportedStatementFormatRegistryEntry = Readonly<{
  statementLayoutSha256: string;
  tableSignatures: readonly string[];
  adapterId: string;
  adapterVersion: string;
  fixtureSha256: string;
}>;

// Runtime support is code-owned. A candidate cannot become globally supported
// until a reviewed importer slice adds its exact verified entry here.
export const JOURNAL_SUPPORTED_STATEMENT_FORMAT_REGISTRY:
readonly JournalSupportedStatementFormatRegistryEntry[] = Object.freeze([]);
