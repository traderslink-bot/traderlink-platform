import { headers as nextHeaders } from "next/headers";
import type Database from "better-sqlite3";

import type { JournalAdminScope } from "../../contracts/journal-admin-scope";
import { withJournalAdminDatabase } from "./platform-admin-authorization";

export async function withJournalAdminPageDatabase<T>(
  operation: (
    database: Database.Database,
    scope: JournalAdminScope,
  ) => T,
): Promise<T> {
  return withJournalAdminDatabase(await nextHeaders(), operation);
}
