import Database from "better-sqlite3";
import { describe, expect, it } from "vitest";

import { buildSyntheticCanonicalExecution } from "../testing";

describe("Trader Intelligence v3 SQLite exact TEXT compatibility", () => {
  it("round-trips exact financial strings and lowercase digest without REAL columns", () => {
    const database = new Database(":memory:");
    try {
      database.exec(`
        CREATE TABLE ti_v3_exact_compatibility (
          id INTEGER PRIMARY KEY,
          quantity TEXT NOT NULL,
          price TEXT NOT NULL,
          charge TEXT NOT NULL,
          pnl TEXT NOT NULL,
          digest TEXT NOT NULL
        )
      `);
      const execution = buildSyntheticCanonicalExecution({
        quantity: "0.123456789012",
        price: "0.000000000001",
        charges: [
          { kind: "synthetic_rebate", amount: "-0.000000000000000000000001", currency: "USD" },
        ],
      });
      database
        .prepare(
          `INSERT INTO ti_v3_exact_compatibility
            (id, quantity, price, charge, pnl, digest)
           VALUES (?, ?, ?, ?, ?, ?)`,
        )
        .run(
          101,
          execution.content.quantity,
          execution.content.price,
          execution.content.charges[0].amount,
          "123456789.000000000000000000000001",
          execution.canonicalContentDigest,
        );
      const row = database
        .prepare(
          `SELECT
             quantity,
             price,
             charge,
             pnl,
             digest,
             typeof(quantity) AS quantity_type,
             typeof(price) AS price_type,
             typeof(charge) AS charge_type,
             typeof(pnl) AS pnl_type,
             typeof(digest) AS digest_type
           FROM ti_v3_exact_compatibility
           WHERE id = ?`,
        )
        .get(101) as Record<string, string>;
      expect(row).toEqual({
        quantity: "0.123456789012",
        price: "0.000000000001",
        charge: "-0.000000000000000000000001",
        pnl: "123456789.000000000000000000000001",
        digest: execution.canonicalContentDigest,
        quantity_type: "text",
        price_type: "text",
        charge_type: "text",
        pnl_type: "text",
        digest_type: "text",
      });
      const columns = database.prepare("PRAGMA table_info(ti_v3_exact_compatibility)").all() as {
        name: string;
        type: string;
      }[];
      expect(columns.filter((column) => ["quantity", "price", "charge", "pnl"].includes(column.name))).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: "quantity", type: "TEXT" }),
          expect.objectContaining({ name: "price", type: "TEXT" }),
          expect.objectContaining({ name: "charge", type: "TEXT" }),
          expect.objectContaining({ name: "pnl", type: "TEXT" }),
        ]),
      );
      expect(columns.some((column) => column.type === "REAL")).toBe(false);
    } finally {
      database.close();
    }
  });

  it("keeps content digest independent from SQLite row IDs", () => {
    const execution = buildSyntheticCanonicalExecution();
    const database = new Database(":memory:");
    try {
      database.exec("CREATE TABLE identities (id INTEGER PRIMARY KEY, digest TEXT NOT NULL)");
      const insert = database.prepare("INSERT INTO identities (id, digest) VALUES (?, ?)");
      insert.run(1, execution.canonicalContentDigest);
      insert.run(999, execution.canonicalContentDigest);
      const digests = database
        .prepare("SELECT digest FROM identities ORDER BY id")
        .all() as { digest: string }[];
      expect(digests.map((row) => row.digest)).toEqual([
        execution.canonicalContentDigest,
        execution.canonicalContentDigest,
      ]);
    } finally {
      database.close();
    }
  });
});
