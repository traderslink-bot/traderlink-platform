import type Database from "better-sqlite3";

import { createCanonicalUuidV4 } from "@/src/modules/platform/server/database/platform-migration-contract";
import { JournalDemoMaterializer } from "./journal-demo-materializer";
import type { JournalDemoFinancialPack } from "./journal-demo-pack-contract";

export type JournalDemoAccountActivationResult = Readonly<{ accountId: string | null; state: "materialized" | "unavailable" }>;

export class JournalDemoAccountActivationService {
  constructor(private readonly database: Database.Database, private readonly dependencies: Readonly<{
    createId?: () => string; now?: () => Date; resolvePack?: () => JournalDemoFinancialPack | null;
  }> = {}) {}

  activateForNewWorkspace(input: Readonly<{ baseCurrency: string; userId: string; tradingTimezone: string; workspaceId: string }>): JournalDemoAccountActivationResult {
    try {
      return new JournalDemoMaterializer(this.database, {
        createId: this.dependencies.createId ?? createCanonicalUuidV4,
        now: this.dependencies.now, resolvePack: this.dependencies.resolvePack,
      }).materializeForNewWorkspace({ baseCurrency: input.baseCurrency, createdForUserId: input.userId,
        tradingTimezone: input.tradingTimezone, workspaceId: input.workspaceId });
    } catch {
      // Authentication is already durable. A rejected pack must not break the session or preserve partial facts.
      return Object.freeze({ accountId: null, state: "unavailable" });
    }
  }
}
