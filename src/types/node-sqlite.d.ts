// This project still uses Node 20's type package. The demo worker runs on
// Node 22+ and uses this subset of the built-in SQLite session API.
declare module "node:sqlite" {
  export type SQLInputValue = null | number | bigint | string | Uint8Array;
  type Row = Record<string, SQLInputValue>;

  class StatementSync {
    all(...parameters: SQLInputValue[]): Row[];
    get(...parameters: SQLInputValue[]): Row | undefined;
    run(...parameters: SQLInputValue[]): { changes: number | bigint; lastInsertRowid: number | bigint };
  }

  export class DatabaseSync {
    constructor(path: string);
    readonly isTransaction: boolean;
    prepare(sql: string): StatementSync;
    exec(sql: string): void;
    createSession(): { changeset(): Uint8Array; close(): void };
    applyChangeset(
      bytes: Uint8Array,
      options?: { filter?: (table: string) => boolean; onConflict?: (kind: number) => number },
    ): boolean;
    close(): void;
  }

  export const constants: { readonly SQLITE_CHANGESET_ABORT: number };
}
