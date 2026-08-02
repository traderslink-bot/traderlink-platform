import type Database from "better-sqlite3";

import {
  LEGACY_INTELLIGENCE_ROUTE_COUNT,
  LEGACY_INTELLIGENCE_ROUTE_DISPOSITIONS,
  type LegacyIntelligenceRouteDispositionKind,
} from "../../contracts/legacy-intelligence-route-disposition";
import type { WorkspaceAccessScope } from "../../contracts/workspace-access-scope";
import {
  currentPlatformDomainTableNames,
  currentPlatformTableNames,
  platformMigrationManifest,
} from "../database/platform-migration-manifest";
import {
  listPlatformUserTableNames,
  readAppliedPlatformMigrations,
} from "../database/platform-migration-registry";

export type PlatformReadinessState = "ready" | "pending";

export type PlatformReadinessViewModel = Readonly<{
  storage: Readonly<{
    state: "verified";
    appliedMigrationCount: number;
    expectedMigrationCount: number;
    observedTableCount: number;
    expectedTableCount: number;
    domainTableCount: number;
  }>;
  ownership: Readonly<{
    stablePlatformOwnerAvailable: boolean;
    stableWorkspaceAvailable: boolean;
    activeJournalAccountAvailable: boolean;
    allowedJournalAccountCount: number;
    workspaceRole: WorkspaceAccessScope["workspaceRole"];
  }>;
  modules: readonly Readonly<{
    moduleNamespace: string;
    appliedMigrationCount: number;
    state: "storage_boundary_applied";
  }>[];
  legacyRoutes: Readonly<{
    total: number;
    byDisposition: Readonly<Record<LegacyIntelligenceRouteDispositionKind, number>>;
  }>;
  launchGates: readonly Readonly<{
    id: string;
    label: string;
    detail: string;
    state: PlatformReadinessState;
  }>[];
}>;

function countLegacyDispositions(): Readonly<
  Record<LegacyIntelligenceRouteDispositionKind, number>
> {
  const counts: Record<LegacyIntelligenceRouteDispositionKind, number> = {
    canonical_redirect: 0,
    compatibility_redirect: 0,
    operations_only: 0,
    owner_rejected_test_surface: 0,
  };
  for (const route of LEGACY_INTELLIGENCE_ROUTE_DISPOSITIONS) {
    counts[route.kind] += 1;
  }
  return Object.freeze(counts);
}

export class PlatformReadinessReadService {
  readonly #database: Database.Database;

  constructor(database: Database.Database) {
    this.#database = database;
  }

  get(scope: WorkspaceAccessScope): PlatformReadinessViewModel {
    const appliedMigrations = readAppliedPlatformMigrations(this.#database);
    const observedTables = listPlatformUserTableNames(this.#database);
    const moduleCounts = new Map<string, number>();
    for (const migration of appliedMigrations) {
      moduleCounts.set(
        migration.module_namespace,
        (moduleCounts.get(migration.module_namespace) ?? 0) + 1,
      );
    }

    const modules = [...moduleCounts.entries()]
      .sort(([left], [right]) => left.localeCompare(right, "en"))
      .map(([moduleNamespace, appliedMigrationCount]) =>
        Object.freeze({
          appliedMigrationCount,
          moduleNamespace,
          state: "storage_boundary_applied" as const,
        }),
      );

    return Object.freeze({
      launchGates: Object.freeze([
        Object.freeze({
          detail:
            "Guarded loopback access uses the stable development owner without a public login.",
          id: "local_review",
          label: "Local dashboard review",
          state: "ready" as const,
        }),
        Object.freeze({
          detail:
            "Discord will be linked to existing Platform identities immediately before public launch.",
          id: "discord_public_identity",
          label: "Public Discord login",
          state: "pending" as const,
        }),
        Object.freeze({
          detail:
            "Named hosted stores must be reconciled without guessing user or ownership mappings.",
          id: "hosted_data_adoption",
          label: "Hosted data adoption",
          state: "pending" as const,
        }),
        Object.freeze({
          detail:
            "Full regression, build and browser verification remain the final acceptance gate.",
          id: "integrated_verification",
          label: "Integrated verification",
          state: "pending" as const,
        }),
      ]),
      legacyRoutes: Object.freeze({
        byDisposition: countLegacyDispositions(),
        total: LEGACY_INTELLIGENCE_ROUTE_COUNT,
      }),
      modules: Object.freeze(modules),
      ownership: Object.freeze({
        activeJournalAccountAvailable:
          scope.activeAccountId !== null &&
          scope.allowedAccountIds.includes(scope.activeAccountId),
        allowedJournalAccountCount: scope.allowedAccountIds.length,
        stablePlatformOwnerAvailable: scope.workspaceRole === "owner",
        stableWorkspaceAvailable: scope.allowedAccountIds.length > 0,
        workspaceRole: scope.workspaceRole,
      }),
      storage: Object.freeze({
        appliedMigrationCount: appliedMigrations.length,
        domainTableCount: currentPlatformDomainTableNames.length,
        expectedMigrationCount: platformMigrationManifest.length,
        expectedTableCount: currentPlatformTableNames.size,
        observedTableCount: observedTables.length,
        state: "verified" as const,
      }),
    });
  }
}
