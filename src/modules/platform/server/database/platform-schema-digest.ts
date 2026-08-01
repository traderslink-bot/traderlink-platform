import { createHash } from "node:crypto";

import type Database from "better-sqlite3";

import {
  normalizePlatformLineEndings,
  platformFailure,
} from "./platform-migration-contract";

export type PlatformSchemaRow = Readonly<{
  type: string;
  name: string;
  tbl_name: string;
  sql: string;
}>;

export const PLATFORM_SCHEMA_DIGEST_QUERY = `
SELECT type, name, tbl_name, sql
FROM sqlite_schema
WHERE type IN ('table', 'index', 'view', 'trigger')
  AND substr(name, 1, 7) <> 'sqlite_'
ORDER BY
  type COLLATE BINARY,
  name COLLATE BINARY,
  tbl_name COLLATE BINARY
`;

export function serializePlatformSchemaRows(
  rows: readonly PlatformSchemaRow[],
): string {
  const serializedRows = rows.map((row) => {
    if (
      typeof row.type !== "string" ||
      typeof row.name !== "string" ||
      typeof row.tbl_name !== "string" ||
      typeof row.sql !== "string"
    ) {
      platformFailure("TRADERLINK_PLATFORM_SCHEMA_MISMATCH");
    }
    return [row.type, row.name, row.tbl_name, normalizePlatformLineEndings(row.sql)] as const;
  });
  return `${JSON.stringify(serializedRows)}\n`;
}

export function calculatePlatformSchemaDigestFromRows(
  rows: readonly PlatformSchemaRow[],
): string {
  return createHash("sha256")
    .update(serializePlatformSchemaRows(rows), "utf8")
    .digest("hex");
}

export function readPlatformSchemaRows(
  database: Database.Database,
): readonly PlatformSchemaRow[] {
  return database.prepare<[], PlatformSchemaRow>(PLATFORM_SCHEMA_DIGEST_QUERY).all();
}

export function calculatePlatformSchemaDigest(
  database: Database.Database,
): string {
  return calculatePlatformSchemaDigestFromRows(readPlatformSchemaRows(database));
}
