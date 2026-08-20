import type { PlatformMigration } from
  "@/src/modules/platform/server/database/platform-migration-contract";

const sql = `CREATE TRIGGER coach_ai_chat_messages_deterministic_fast_path_guard
BEFORE INSERT ON coach_ai_chat_messages
WHEN json_type(
  NEW.structured_interpretation_json,
  '$.deterministicIdempotencySha256'
) IS NOT NULL AND (
  NEW.role <> 'user'
  OR json_type(
    NEW.structured_interpretation_json,
    '$.deterministicIdempotencySha256'
  ) <> 'text'
  OR length(json_extract(
    NEW.structured_interpretation_json,
    '$.deterministicIdempotencySha256'
  )) <> 64
  OR json_extract(
    NEW.structured_interpretation_json,
    '$.deterministicIdempotencySha256'
  ) <> lower(json_extract(
    NEW.structured_interpretation_json,
    '$.deterministicIdempotencySha256'
  ))
  OR json_extract(
    NEW.structured_interpretation_json,
    '$.deterministicIdempotencySha256'
  ) GLOB '*[^0-9a-f]*'
  OR json_extract(
    NEW.structured_interpretation_json,
    '$.generationSource'
  ) <> 'links_deterministic_fast_path_v1'
  OR json_type(
    NEW.structured_interpretation_json,
    '$.deterministicRouteKey'
  ) <> 'text'
)
BEGIN
  SELECT RAISE(ABORT, 'coach_ai_chat_deterministic_fast_path_invalid');
END;

CREATE UNIQUE INDEX coach_ai_chat_messages_deterministic_idempotency
ON coach_ai_chat_messages(
  account_id,
  json_extract(
    structured_interpretation_json,
    '$.deterministicIdempotencySha256'
  )
)
WHERE role = 'user'
  AND json_type(
    structured_interpretation_json,
    '$.deterministicIdempotencySha256'
  ) = 'text';`;

export const coachAiChatDeterministicFastPathMigration: PlatformMigration =
  Object.freeze({
    moduleNamespace: "coach",
    migrationId: "0068_coach_ai_chat_deterministic_fast_path",
    executionOrder: 68,
    statements: Object.freeze([sql]),
  });
