// @vitest-environment node
import Database from "better-sqlite3";
import { describe, expect, it } from "vitest";
import { captureErasureClosure } from "./platform-erasure-closure";

describe("rooted erasure closure on synthetic databases", () => {
  it("follows composite, implicit and cyclic references while retaining unrelated orphans and NULL FKs", () => {
    const db = new Database(":memory:");
    try {
      // Deliberately malformed unrelated rows exercise the old global-sweep bug.
      db.pragma("foreign_keys=OFF");
      db.exec(`CREATE TABLE roots(a TEXT COLLATE NOCASE, b INTEGER, PRIMARY KEY(a,b)) WITHOUT ROWID;
        CREATE TABLE child(id INTEGER PRIMARY KEY, a TEXT, b INTEGER, next_id INTEGER REFERENCES child(id), FOREIGN KEY(a,b) REFERENCES roots);
        CREATE TABLE leaf(id TEXT PRIMARY KEY, child_id INTEGER REFERENCES child(id));
        INSERT INTO roots VALUES('target',1),('other',2);
        INSERT INTO child VALUES(1,'TARGET',1,2),(2,'target',1,1),(3,'other',2,NULL),(4,'missing',5,NULL),(5,NULL,1,NULL);
        INSERT INTO leaf VALUES('delete',1),('keep',3),('orphan',99);`);
      db.transaction(() => {
        const closure = captureErasureClosure(db, [{ table: "roots", column: "a", value: "target" }]);
        expect(closure.rowCount).toBe(4);
        expect(closure.deleteRows()).toBe(4);
        closure.dispose();
      }).immediate();
      expect(db.prepare("SELECT id FROM child ORDER BY id").all()).toEqual([{ id: 3 }, { id: 4 }, { id: 5 }]);
      expect(db.prepare("SELECT id FROM leaf ORDER BY id").all()).toEqual([{ id: "keep" }, { id: "orphan" }]);
    } finally { db.close(); }
  });

  it("rolls back every change and temporary key table on a row budget refusal", () => {
    const db = new Database(":memory:");
    try {
      db.exec("CREATE TABLE roots(id TEXT PRIMARY KEY); CREATE TABLE child(id INTEGER PRIMARY KEY, root TEXT REFERENCES roots(id)); INSERT INTO roots VALUES('target'); INSERT INTO child VALUES(1,'target'),(2,'target');");
      expect(() => db.transaction(() => captureErasureClosure(db,
        [{ table: "roots", column: "id", value: "target" }], { maxRows: 2 })).immediate()).toThrow("erasure_row_budget");
      expect(db.prepare("SELECT COUNT(*) AS n FROM child").get()).toEqual({ n: 2 });
      expect(db.prepare("SELECT name FROM sqlite_temp_schema WHERE type='table'").all()).toEqual([]);
    } finally { db.close(); }
  });

  it("preserves FK enforcement and deletes a long chain without a fixed pass cutoff", () => {
    const db = new Database(":memory:");
    try {
      db.pragma("foreign_keys=ON");
      db.exec("CREATE TABLE nodes(id INTEGER PRIMARY KEY, parent INTEGER REFERENCES nodes(id)); INSERT INTO nodes VALUES(1,NULL);");
      const add = db.prepare("INSERT INTO nodes VALUES(?,?)");
      for (let i = 2; i <= 40; i++) add.run(i, i - 1);
      db.transaction(() => {
        db.pragma("defer_foreign_keys=ON");
        const closure = captureErasureClosure(db, [{ table: "nodes", column: "id", value: "1" }]);
        expect(closure.rowCount).toBe(40);
        closure.deleteRows(); closure.dispose();
        expect(db.pragma("foreign_key_check")).toEqual([]);
      }).immediate();
      expect(db.pragma("foreign_keys", { simple: true })).toBe(1);
    } finally { db.close(); }
  });
  it("refuses a reachable cross-account row instead of broadening authorization", () => {
    const db = new Database(":memory:");
    try {
      db.exec("CREATE TABLE roots(id INTEGER PRIMARY KEY, account_id TEXT); CREATE TABLE child(id INTEGER PRIMARY KEY, account_id TEXT, root INTEGER REFERENCES ROOTS(id) ON DELETE CASCADE); INSERT INTO roots VALUES(1,'target'); INSERT INTO child VALUES(1,'other',1);");
      expect(() => db.transaction(() => captureErasureClosure(db,
        [{ table: "roots", column: "account_id", value: "target" }], { accountIds: ["target"] })).immediate()).toThrow("erasure_cross_scope_dependency");
      expect(db.prepare("SELECT COUNT(*) AS n FROM roots").get()).toEqual({ n: 1 });
    } finally { db.close(); }
  });
  it("leaves a large unrelated News population unchanged without adding it to the closure", () => {
    const db = new Database(":memory:");
    try {
      db.exec(`CREATE TABLE roots(id INTEGER PRIMARY KEY); INSERT INTO roots VALUES(1);
        CREATE TABLE unrelated_news(id INTEGER PRIMARY KEY, body BLOB NOT NULL);
        WITH RECURSIVE rows(n) AS (VALUES(1) UNION ALL SELECT n+1 FROM rows WHERE n<10000)
        INSERT INTO unrelated_news SELECT n,zeroblob(1024) FROM rows;`);
      const before = db.prepare("SELECT COUNT(*) AS n,SUM(length(body)) AS bytes FROM unrelated_news").get();
      db.transaction(() => {
        const closure = captureErasureClosure(db, [{ table: "roots", column: "id", value: "1" }]);
        expect(closure.rowCount).toBe(1); closure.deleteRows(); closure.dispose();
      }).immediate();
      expect(db.prepare("SELECT COUNT(*) AS n,SUM(length(body)) AS bytes FROM unrelated_news").get()).toEqual(before);
    } finally { db.close(); }
  });
  it("preserves shared payloads when native FK policy clears or replaces only their reference", () => {
    const db = new Database(":memory:");
    try {
      db.pragma("foreign_keys=ON");
      db.exec(`CREATE TABLE roots(id INTEGER PRIMARY KEY); INSERT INTO roots VALUES(1),(2);
        CREATE TABLE nullable_child(id INTEGER PRIMARY KEY, parent INTEGER REFERENCES roots(id) ON DELETE SET NULL,payload TEXT);
        CREATE TABLE default_child(id INTEGER PRIMARY KEY, parent INTEGER DEFAULT 2 REFERENCES roots(id) ON DELETE SET DEFAULT,payload TEXT);
        INSERT INTO nullable_child VALUES(1,1,'retained'); INSERT INTO default_child VALUES(1,1,'retained');`);
      db.transaction(() => {
        db.pragma("defer_foreign_keys=ON");
        const closure = captureErasureClosure(db, [{ table: "roots", column: "id", value: "1" }]);
        expect(closure.rowCount).toBe(1); closure.deleteRows(); closure.dispose();
      }).immediate();
      expect(db.prepare("SELECT parent,payload FROM nullable_child").get()).toEqual({ parent: null, payload: "retained" });
      expect(db.prepare("SELECT parent,payload FROM default_child").get()).toEqual({ parent: 2, payload: "retained" });
      expect(db.pragma("foreign_key_check")).toEqual([]);
    } finally { db.close(); }
  });
});
