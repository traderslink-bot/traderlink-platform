export type JournalCountByCode = Readonly<Record<string, number>>;

export type JournalRebuildCoverageRecord = Readonly<{
  chainKeySha256: string;
  algorithmVersion: string;
  orderedInputSha256: string;
  outputSha256: string;
  coverageState: "complete" | "partial" | "unavailable";
  excludedExecutionCount: number;
  completedAtUtc: string;
}>;

export type JournalIntegrityCoverageSummary = Readonly<{
  workspaceId: string;
  accountId: string;
  accountScope: Readonly<{
    baseCurrency: string;
    tradingTimezone: string;
  }>;
  sourceRecords: Readonly<{
    total: number;
    byClassification: JournalCountByCode;
  }>;
  imports: Readonly<{
    total: number;
    byState: JournalCountByCode;
  }>;
  executions: Readonly<{
    total: number;
    byState: JournalCountByCode;
  }>;
  decisions: Readonly<{
    total: number;
    byState: JournalCountByCode;
    pendingByReason: JournalCountByCode;
    resolvedByAction: JournalCountByCode;
    acceptedSourceLimitationsByIssue: JournalCountByCode;
  }>;
  roundTrips: Readonly<{
    activeTotal: number;
    byProjectionState: JournalCountByCode;
    affectedChainCount: number;
    unaffectedChainCount: number;
  }>;
  positionFacts: Readonly<{
    currentTotal: number;
    byKind: JournalCountByCode;
  }>;
  coverageIntervals: Readonly<{
    total: number;
    byKind: JournalCountByCode;
    accountTimezoneCompatibleCompleteCount: number;
    accountTimezoneMismatchCount: number;
    overlappingCompleteIntervalCount: number;
    completeCoverageGapCount: number;
    earliestLocalDate: string | null;
    latestLocalDate: string | null;
  }>;
  unsupportedSourceRecords: Readonly<{
    total: number;
    byAssetCategory: JournalCountByCode;
  }>;
  rebuilds: Readonly<{
    latestByChain: readonly JournalRebuildCoverageRecord[];
    freshness: "recorded_not_recomputed" | "unavailable";
  }>;
}>;
