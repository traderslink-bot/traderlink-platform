import type Database from "better-sqlite3";

import { createCanonicalUuidV4, TraderLinkPlatformError } from "@/src/modules/platform/server/database/platform-migration-contract";
import { JournalDemoAccountRepository } from "./journal-demo-account-repository";
import { JournalDemoMaterializer } from "./journal-demo-materializer";
import type { JournalDemoFinancialPack } from "./journal-demo-pack-contract";

export type JournalDemoAccountActivationResult = Readonly<{
  accountId: string | null;
  state: "cleared" | "materialized" | "unavailable";
}>;

export class JournalDemoAccountActivationService {
  constructor(private readonly database: Database.Database, private readonly dependencies: Readonly<{
    createId?: () => string; now?: () => Date; resolvePack?: () => JournalDemoFinancialPack | null;
  }> = {}) {}

  activateForWorkspace(input: Readonly<{ baseCurrency: string; userId: string; tradingTimezone: string; workspaceId: string }>): JournalDemoAccountActivationResult {
    try {
      if (new JournalDemoAccountRepository(this.database).findLifecycleForUser(input)?.state === "cleared") {
        return Object.freeze({ accountId: null, state: "cleared" });
      }
      return new JournalDemoMaterializer(this.database, {
        createId: this.dependencies.createId ?? createCanonicalUuidV4,
        now: this.dependencies.now, resolvePack: this.dependencies.resolvePack,
      }).materializeForWorkspace({ baseCurrency: input.baseCurrency, createdForUserId: input.userId,
        tradingTimezone: input.tradingTimezone, workspaceId: input.workspaceId });
    } catch (error) {
      // Only machine codes and validation field names; never log identity, SQL, or source data.
      const token = (value: unknown) => typeof value === "string" && /^[A-Za-z][A-Za-z0-9_]{0,100}$/.test(value) ? value : undefined;
      const code = error instanceof TraderLinkPlatformError ? error.code
        : error instanceof Error && /^demo_august_|^journal_demo_/.test(error.message) ? token(error.message)
        : error && typeof error === "object" && "code" in error ? token(error.code) : undefined;
      console.error("journal_demo_activation_failed", {
        code: code ?? "demo_activation_unexpected",
        field: error instanceof TraderLinkPlatformError ? token(error.safeContext.field) : undefined,
      });
      // Authentication is already durable. A rejected pack must not break the session or preserve partial facts.
      return Object.freeze({ accountId: null, state: "unavailable" });
    }
  }
}
