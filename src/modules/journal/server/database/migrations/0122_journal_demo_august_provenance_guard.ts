import type { PlatformMigration } from "@/src/modules/platform/server/database/platform-migration-contract";

// Both triggers apply the same materializer-only contract. Preserve the legacy
// 0097 exception and add the approved v9 upgrade; ordinary imports stay blocked.
function permittedBatch(row: "NEW" | "batch"): string {
  return `${row}.source_kind = 'manual_batch'
  AND ${row}.source_system = 'demo_market_pack'
  AND ${row}.source_identity_id IS NULL
  AND ${row}.source_file_sha256 IS NULL
  AND ${row}.source_file_size_bytes IS NULL
  AND ${row}.source_mime_type IS NULL
  AND ${row}.source_encoding IS NULL
  AND ${row}.source_display_label = 'Demo Trade Tracker synthetic data'
  AND ${row}.evidence_object_key IS NULL
  AND ${row}.adapter_id = 'demo_market_pack'
  AND ${row}.adapter_version = 'demo_market_pack_v1'
  AND ${row}.parser_version = 'demo_market_candle_v1'
  AND ${row}.mapping_version = 'demo_market_pack_v1'
  AND ${row}.source_timezone = 'America/New_York'
  AND ${row}.current_state = 'accepted'
  AND ${row}.unsupported_row_count = 0
  AND ${row}.issue_count = 0
  AND ${row}.pending_decision_count = 0
  AND ${row}.created_by_user_id = (
    SELECT demo.created_for_user_id FROM journal_demo_accounts demo
    WHERE demo.workspace_id = ${row}.workspace_id AND demo.account_id = ${row}.account_id
  )
  AND (
    (
      ${row}.manual_idempotency_key = '40bad70a5f377ba801ffe9a71bcc78c933affff219c2cd298356e16b2119a707'
      AND ${row}.mapping_contract_json = '{"contractVersion":"demo_market_pack_v1","source":"mixed_synthetic_demo_analyzer_and_journal_only_v2"}'
      AND ${row}.statement_period_start_date = '2026-08-26'
      AND ${row}.statement_period_end_date = '2026-08-27'
      AND ${row}.preserved_row_count = 232
      AND ${row}.mapped_execution_count = 232
    ) OR (
      ${row}.manual_idempotency_key = '21b21bb363a674160908ac42dda14573919377238c34d6efcce1a86a1e5d95b0'
      AND ${row}.mapping_contract_json = '{"contractVersion":"demo_market_pack_v1","source":"mixed_synthetic_demo_analyzer_and_journal_only"}'
      AND ${row}.statement_period_start_date = '2026-08-03'
      AND ${row}.statement_period_end_date = '2026-08-31'
      AND ${row}.preserved_row_count BETWEEN 187 AND 811
      AND ${row}.mapped_execution_count = ${row}.preserved_row_count
      AND EXISTS (
        SELECT 1 FROM journal_demo_pack_versions pack
        WHERE pack.demo_pack_version_id = 'd65a9ce3-7b4d-4a36-92a8-80e961c6a909'
          AND pack.pack_key = 'daily_tracker_demo' AND pack.pack_version = 9
          AND pack.materializer_version = 'demo_canonical_journal_v9'
      )
      AND NOT EXISTS (
        SELECT 1 FROM journal_demo_lifecycle lifecycle
        WHERE lifecycle.workspace_id = ${row}.workspace_id
          AND lifecycle.user_id = ${row}.created_by_user_id
          AND lifecycle.lifecycle_state = 'cleared'
      )
    )
  )`;
}

const sql = `DROP TRIGGER journal_demo_accounts_block_import_batches;
DROP TRIGGER journal_demo_accounts_block_generic_execution_provenance;

CREATE TRIGGER journal_demo_accounts_block_import_batches
BEFORE INSERT ON journal_import_batches
WHEN EXISTS (
  SELECT 1 FROM journal_demo_accounts demo
  WHERE demo.workspace_id = NEW.workspace_id AND demo.account_id = NEW.account_id
) AND NOT (${permittedBatch("NEW")})
BEGIN SELECT RAISE(ABORT, 'demo accounts cannot accept manual or broker imports'); END;

CREATE TRIGGER journal_demo_accounts_block_generic_execution_provenance
BEFORE INSERT ON journal_execution_provenance
WHEN EXISTS (
  SELECT 1 FROM journal_demo_accounts demo
  WHERE demo.workspace_id = NEW.workspace_id AND demo.account_id = NEW.account_id
) AND NOT (
  NEW.provenance_kind = 'manual'
  AND NEW.provider_identity_scheme_version IS NULL
  AND NEW.provider_identity_sha256 IS NULL
  AND EXISTS (
    SELECT 1 FROM journal_import_batches batch
    JOIN journal_demo_accounts demo
      ON demo.workspace_id = batch.workspace_id AND demo.account_id = batch.account_id
    WHERE batch.workspace_id = NEW.workspace_id
      AND batch.account_id = NEW.account_id
      AND batch.import_batch_id = NEW.import_batch_id
      AND (${permittedBatch("batch")})
  )
)
BEGIN SELECT RAISE(ABORT, 'demo executions require demo provenance'); END;`;

export const journalDemoAugustProvenanceGuardMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "journal",
  migrationId: "0122_journal_demo_august_provenance_guard",
  executionOrder: 122,
  statements: Object.freeze([sql]),
});
