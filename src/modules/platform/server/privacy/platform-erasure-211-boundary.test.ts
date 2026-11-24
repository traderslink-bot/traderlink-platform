import Database from "better-sqlite3";
import { beforeAll, expect, test } from "vitest";
import { platformMigrationManifest } from "../database/platform-migration-manifest";
import { readAppliedPlatformMigrations, type AppliedPlatformMigrationRow } from "../database/platform-migration-registry";
import { runPlatformMigrations } from "../database/run-platform-migrations";
import {
  isReviewed210PremiumEventsBoundary,
  isReviewed210PremiumEventsLedgerPrefix,
  isReviewed211NewsMembershipsLedger,
  isReviewed211NewsMembershipsPremiumEventsBoundary,
} from "./platform-erasure-210-boundary";

const manifest210 = platformMigrationManifest.slice(0, 210);
let ledger210: readonly AppliedPlatformMigrationRow[];
let ledger211: readonly AppliedPlatformMigrationRow[];

beforeAll(() => {
  const database = new Database(":memory:");
  try {
    database.pragma("foreign_keys=ON");
    runPlatformMigrations(database, { manifest: manifest210 });
    ledger210 = readAppliedPlatformMigrations(database);
    expect(runPlatformMigrations(database, { manifest: platformMigrationManifest, atomicSuffix: true }).appliedMigrationIds)
      .toEqual(["0227_news_article_ingestion_memberships"]);
    ledger211 = readAppliedPlatformMigrations(database);
  } finally {
    database.close();
  }
});

test("the existing 210 boundary and exact News-only 211 successor both qualify", () => {
  expect(isReviewed210PremiumEventsLedgerPrefix(ledger210)).toBe(true);
  expect(isReviewed210PremiumEventsBoundary(ledger210, manifest210)).toBe(true);
  expect(isReviewed211NewsMembershipsLedger(ledger211)).toBe(true);
  expect(isReviewed211NewsMembershipsPremiumEventsBoundary(ledger211, platformMigrationManifest)).toBe(true);
  expect(isReviewed211NewsMembershipsLedger(ledger210)).toBe(false);
  expect(isReviewed210PremiumEventsLedgerPrefix(ledger211)).toBe(false);
});

test("exact 211 gate rejects a changed predecessor, successor or new migration", () => {
  const predecessor = ledger210[0]!;
  const successor = ledger211[210]!;
  expect(isReviewed211NewsMembershipsLedger([{ ...predecessor, checksum_sha256: "0".repeat(64) }, ...ledger211.slice(1)]))
    .toBe(false);
  expect(isReviewed211NewsMembershipsLedger([...ledger210, { ...successor, execution_order: 307 }])).toBe(false);
  expect(isReviewed211NewsMembershipsLedger([...ledger210, { ...successor, post_schema_sha256: "1".repeat(64) }])).toBe(false);
  expect(isReviewed211NewsMembershipsLedger([...ledger211, successor])).toBe(false);
  const declared = platformMigrationManifest[210]!;
  expect(isReviewed211NewsMembershipsPremiumEventsBoundary(ledger211, [
    ...manifest210, { ...declared, statements: [...declared.statements, "SELECT 1"] },
  ])).toBe(false);
});
