import type { PlatformMigration } from "@/src/modules/platform/server/database/platform-migration-contract";

const sql = `DROP TRIGGER journal_demo_accounts_block_import_batches;
DROP TRIGGER journal_demo_accounts_block_generic_execution_provenance;

CREATE TRIGGER journal_demo_accounts_block_import_batches
BEFORE INSERT ON journal_import_batches
WHEN EXISTS (
  SELECT 1 FROM journal_demo_accounts demo
  WHERE demo.workspace_id = NEW.workspace_id AND demo.account_id = NEW.account_id
) AND NOT (
  NEW.source_kind = 'manual_batch'
  AND NEW.source_system = 'demo_market_pack'
  AND NEW.source_identity_id IS NULL
  AND NEW.source_file_sha256 IS NULL
  AND NEW.source_file_size_bytes IS NULL
  AND NEW.source_mime_type IS NULL
  AND NEW.source_encoding IS NULL
  AND NEW.source_display_label = 'Demo Trade Tracker synthetic data'
  AND NEW.evidence_object_key IS NULL
  AND NEW.manual_idempotency_key = '40bad70a5f377ba801ffe9a71bcc78c933affff219c2cd298356e16b2119a707'
  AND NEW.adapter_id = 'demo_market_pack'
  AND NEW.adapter_version = 'demo_market_pack_v1'
  AND NEW.parser_version = 'demo_market_candle_v1'
  AND NEW.mapping_version = 'demo_market_pack_v1'
  AND NEW.mapping_contract_json = '{"contractVersion":"demo_market_pack_v1","source":"mixed_synthetic_demo_analyzer_and_journal_only_v2"}'
  AND NEW.statement_period_start_date = '2026-08-26'
  AND NEW.statement_period_end_date = '2026-08-27'
  AND NEW.source_timezone = 'America/New_York'
  AND NEW.current_state = 'accepted'
  AND NEW.preserved_row_count = 232
  AND NEW.mapped_execution_count = 232
  AND NEW.unsupported_row_count = 0
  AND NEW.issue_count = 0
  AND NEW.pending_decision_count = 0
  AND NEW.created_by_user_id = (
    SELECT demo.created_for_user_id FROM journal_demo_accounts demo
    WHERE demo.workspace_id = NEW.workspace_id AND demo.account_id = NEW.account_id
  )
)
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
    SELECT 1
    FROM journal_import_batches batch
    JOIN journal_demo_accounts demo
      ON demo.workspace_id = batch.workspace_id AND demo.account_id = batch.account_id
    WHERE batch.workspace_id = NEW.workspace_id
      AND batch.account_id = NEW.account_id
      AND batch.import_batch_id = NEW.import_batch_id
      AND batch.source_kind = 'manual_batch'
      AND batch.source_system = 'demo_market_pack'
      AND batch.source_identity_id IS NULL
      AND batch.source_file_sha256 IS NULL
      AND batch.source_file_size_bytes IS NULL
      AND batch.source_mime_type IS NULL
      AND batch.source_encoding IS NULL
      AND batch.source_display_label = 'Demo Trade Tracker synthetic data'
      AND batch.evidence_object_key IS NULL
      AND batch.manual_idempotency_key = '40bad70a5f377ba801ffe9a71bcc78c933affff219c2cd298356e16b2119a707'
      AND batch.adapter_id = 'demo_market_pack'
      AND batch.adapter_version = 'demo_market_pack_v1'
      AND batch.parser_version = 'demo_market_candle_v1'
      AND batch.mapping_version = 'demo_market_pack_v1'
      AND batch.mapping_contract_json = '{"contractVersion":"demo_market_pack_v1","source":"mixed_synthetic_demo_analyzer_and_journal_only_v2"}'
      AND batch.statement_period_start_date = '2026-08-26'
      AND batch.statement_period_end_date = '2026-08-27'
      AND batch.source_timezone = 'America/New_York'
      AND batch.current_state = 'accepted'
      AND batch.preserved_row_count = 232
      AND batch.mapped_execution_count = 232
      AND batch.unsupported_row_count = 0
      AND batch.issue_count = 0
      AND batch.pending_decision_count = 0
      AND batch.created_by_user_id = demo.created_for_user_id
  )
)
BEGIN SELECT RAISE(ABORT, 'demo executions require demo provenance'); END;`;

export const journalDemoMaterializerProvenanceGuardMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "journal",
  migrationId: "0097_journal_demo_materializer_provenance_guard",
  executionOrder: 97,
  statements: Object.freeze([sql]),
});
