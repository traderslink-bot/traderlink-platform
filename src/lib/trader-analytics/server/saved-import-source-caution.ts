import {
  DEMO_ACCOUNT_ID,
  type SqliteImportCommitRepository,
} from "../product/import-commit/sqlite-import-commit-repository";
import type {
  ImportCommitBatchRecord,
  ImportCommitSavedTradeRecord,
} from "../product/import-commit/import-commit-planner";
import type { SavedExecutionTrade } from "../product/types";

export interface SavedImportSourceCautionReadModel {
  contractVersion: "saved_import_source_caution_v1";
  source: "saved_sqlite";
  importBatchId: string | null;
  repairedImport: boolean;
  title: string;
  detail: string;
  href: string | null;
  relatedTradeIds: string[];
}

const REPAIRED_TITLE = "Repaired CSV source";
const REPAIRED_DETAIL =
  "This saved import came from repaired CSV rows. Review repaired row values before trusting coaching evidence.";

function buildReadModel(args: {
  batch: ImportCommitBatchRecord | null;
  relatedTradeIds: string[];
}): SavedImportSourceCautionReadModel {
  const repairedImport = args.batch?.repairSource === "repaired_csv";

  return {
    contractVersion: "saved_import_source_caution_v1",
    source: "saved_sqlite",
    importBatchId: args.batch?.id ?? null,
    repairedImport,
    title: repairedImport ? REPAIRED_TITLE : "Original CSV source",
    detail: repairedImport
      ? REPAIRED_DETAIL
      : "This saved import came from the original CSV preview.",
    href: args.batch ? `/imports/${encodeURIComponent(args.batch.id)}` : null,
    relatedTradeIds: args.relatedTradeIds,
  };
}

export function buildLatestSavedImportSourceCautionReadModel(args: {
  repository: SqliteImportCommitRepository;
  accountId?: string;
}): SavedImportSourceCautionReadModel {
  const accountId = args.accountId ?? DEMO_ACCOUNT_ID;
  const batch = args.repository.getLatestCommittedBatch(accountId);
  const relatedTradeIds = batch
    ? args.repository
        .listSavedTrades(accountId)
        .filter((trade) => trade.importBatchId === batch.id)
        .map((trade) => trade.id)
    : [];

  return buildReadModel({ batch, relatedTradeIds });
}

export function buildTradeImportSourceCautionReadModel(args: {
  repository: SqliteImportCommitRepository;
  trade: SavedExecutionTrade | ImportCommitSavedTradeRecord;
}): SavedImportSourceCautionReadModel {
  const batchId = args.trade.importBatchId;
  const batch = batchId ? args.repository.getImportBatch(batchId) : null;

  return buildReadModel({
    batch,
    relatedTradeIds: [args.trade.id],
  });
}
