export const JOURNAL_ADMIN_PAGE_SIZE_DEFAULT = 25;
export const JOURNAL_ADMIN_PAGE_SIZE_MAXIMUM = 100;

export type JournalAdminCoverage = Readonly<{
  dataAsOfUtc: string;
  timezone: "UTC";
  note: string | null;
}>;

export type JournalAdminPage<T> = Readonly<{
  items: readonly T[];
  nextCursor: string | null;
  coverage: JournalAdminCoverage;
}>;

export type JournalAdminMetric = Readonly<{
  value: number | null;
  status: "available" | "unavailable";
  note: string | null;
}>;

export type JournalAdminRateMetric = Readonly<{
  numerator: number;
  denominator: number;
  percentage: number | null;
  note: string | null;
}>;

export type JournalAdminOverview = Readonly<{
  coverage: JournalAdminCoverage & Readonly<{
    attemptInstrumentationStartedAtUtc: string | null;
  }>;
  users: Readonly<{
    registeredProduction: number;
    new24Hours: number;
    new7Days: number;
    new30Days: number;
    signedIn24Hours: number;
    signedIn7Days: number;
    signedIn30Days: number;
    journalActivated: number;
    activeJournalAccounts: number;
    multipleAccountUsers: number;
  }>;
  imports: Readonly<{
    committed: number;
    committedWithDecisions: number;
    mappingRequired: number;
    systemFailed: number;
    formatRecognitionRate: JournalAdminRateMetric;
    commitRate: JournalAdminRateMetric;
    systemFailureRate: JournalAdminRateMetric;
  }>;
  formats: Readonly<{
    newCandidates: number;
    privacyReviewRequired: number;
  }>;
  dataDecisions: Readonly<{
    unresolved: number;
  }>;
  registrationsByDay: readonly Readonly<{
    dayUtc: string;
    registered: number;
    journalActivated: number;
  }>[];
  importOutcomesByDay: readonly Readonly<{
    dayUtc: string;
    states: Readonly<Record<string, number>>;
  }>[];
  queues: Readonly<{
    mappingRequired: readonly JournalAdminImportQueueItem[];
    formatsReadyForDevelopment: readonly JournalAdminFormatQueueItem[];
    recurringDecisionIssues: readonly JournalAdminDecisionIssueAggregate[];
    systemFailures: readonly JournalAdminImportQueueItem[];
  }>;
  latestOperations: readonly JournalAdminOperationSummary[];
}>;

export type JournalAdminUserListItem = Readonly<{
  userRef: string;
  displayName: string;
  status: "active" | "disabled";
  createdAtUtc: string;
  authenticationProviders: readonly string[];
  productionRegistered: boolean;
  lastSuccessfulAuthenticationAtUtc: string | null;
  lastJournalActivityAtUtc: string | null;
  activeJournalAccountCount: number;
  archivedJournalAccountCount: number;
  committedImportCount: number;
  lastImportOutcome: string | null;
  manualExecutionCount: number;
  tradeStylePlanCount: number;
  swingNoteCount: number;
  hasAnalyticsReadyRoundTrip: boolean;
  unresolvedDecisionCount: number;
  activeIn7Days: boolean;
  activeIn30Days: boolean;
}>;

export type JournalAdminUserDetail = Readonly<{
  user: JournalAdminUserListItem;
  sessionCount: number;
  activeSessionCount: number;
  accounts: readonly Readonly<{
    accountRef: string;
    displayName: string;
    status: "active" | "archived";
    tradingTimezone: string;
    baseCurrency: string;
    committedImportCount: number;
    manualExecutionCount: number;
    unresolvedDecisionCount: number;
    analyticsReadyRoundTripCount: number;
    ruleCount: number;
    tagCount: number;
    dailyNoteCount: number;
    tradeNoteCount: number;
    swingNoteCount: number;
  }>[];
  privacyRequestState: "not_available";
}>;

export type JournalAdminImportCoverageKind =
  | "tracked_attempt"
  | "historical_committed_import";

export type JournalAdminImportListItem = Readonly<{
  importRef: string;
  coverageKind: JournalAdminImportCoverageKind;
  submittedAtUtc: string;
  completedAtUtc: string | null;
  userDisplayName: string;
  accountDisplayName: string;
  safeBrokerLabel: string | null;
  formatRef: string | null;
  formatState: string | null;
  mappingOrigin: "verified_adapter" | "saved_account_template" | "manual_map" | "unavailable";
  adapterId: string | null;
  adapterVersion: string | null;
  parserVersion: string | null;
  mappingVersion: string | null;
  currentState: string;
  preservedRowCount: number;
  mappedExecutionCount: number;
  unsupportedRowCount: number;
  issueCount: number;
  pendingDecisionCount: number;
  linkedImportState: string | null;
  processingDurationMs: number | null;
  safeFailureCategory: string | null;
  developerPackageAvailable: boolean;
  consentedSourceAvailable: boolean;
}>;

export type JournalAdminImportQueueItem = Pick<
  JournalAdminImportListItem,
  "importRef" | "submittedAtUtc" | "userDisplayName" | "accountDisplayName" |
  "safeBrokerLabel" | "currentState" | "safeFailureCategory"
>;

export type JournalAdminImportDetail = Readonly<{
  summary: JournalAdminImportListItem;
  timeline: readonly Readonly<{
    sequence: number;
    priorState: string | null;
    newState: string;
    reasonCode: string;
    safeCounts: Readonly<Record<string, number>>;
    occurredAtUtc: string;
  }>[];
  sanitizedStructure: unknown | null;
  mappingAvailable: boolean;
  decisionIssues: readonly Readonly<{
    decisionRef: string;
    issueCode: string;
    state: string;
    targetKind: string;
  }>[];
  reprocessEligibility: "eligible" | "requires_source_reselection" | "not_applicable";
}>;

export type JournalAdminStatementFormatItem = Readonly<{
  formatRef: string;
  revision: number;
  canonicalBrokerLabel: string | null;
  observedBrokerLabels: readonly string[];
  fileKind: string;
  normalizedEncoding: string;
  delimiterLabel: string | null;
  layoutLabel: string;
  firstObservedAtUtc: string;
  lastObservedAtUtc: string;
  observationCount: number;
  distinctUserCount: number;
  successfulManualMappingCount: number;
  conflictingMappingCount: number;
  deployedAdapterId: string | null;
  deployedAdapterVersion: string | null;
  lifecycleState: string;
  effectiveState: string;
  recommendedNextAction: string;
}>;

export type JournalAdminPrivacyReviewObservation = Readonly<{
  observationRef: string;
  safeBrokerLabel: string | null;
  fileKind: string;
  outcome: "privacy_review_required";
  observedAtUtc: string;
}>;

export type JournalAdminStatementFormats = Readonly<{
  formats: JournalAdminPage<JournalAdminStatementFormatItem>;
  privacyReviewRequired: readonly JournalAdminPrivacyReviewObservation[];
}>;

export type JournalAdminFormatQueueItem = Pick<
  JournalAdminStatementFormatItem,
  "formatRef" | "canonicalBrokerLabel" | "lastObservedAtUtc" |
  "observationCount" | "distinctUserCount" | "effectiveState" |
  "recommendedNextAction"
>;

export type JournalAdminStatementFormatDetail = Readonly<{
  summary: JournalAdminStatementFormatItem;
  sanitizedStructures: readonly unknown[];
  mappingVariants: readonly Readonly<{
    mapping: unknown;
    observationCount: number;
  }>[];
  outcomeCounts: Readonly<Record<string, number>>;
  affectedAttemptCount: number;
  privacyReviewObservationCount: number;
  developerPackageAvailable: boolean;
  consentedSourceCount: number;
  timeline: readonly Readonly<{
    sequence: number;
    priorState: string | null;
    newState: string;
    reasonCode: string;
    occurredAtUtc: string;
  }>[];
}>;

export type JournalAdminDecisionIssueAggregate = Readonly<{
  issueCode: string;
  targetKind: string;
  unresolvedCount: number;
  resolvedCount: number;
  affectedUserCount: number;
  affectedAccountCount: number;
  oldestUnresolvedAtUtc: string | null;
}>;

export type JournalAdminDataDecisionItem = Readonly<{
  decisionRef: string;
  issueCode: string;
  targetKind: string;
  effectCode: string;
  state: string;
  userDisplayName: string;
  accountDisplayName: string;
  createdAtUtc: string;
  updatedAtUtc: string;
  ageDays: number;
}>;

export type JournalAdminDataDecisions = Readonly<{
  coverage: JournalAdminCoverage;
  aggregates: readonly JournalAdminDecisionIssueAggregate[];
  oldestUnresolved: readonly JournalAdminDataDecisionItem[];
  resolutionActions: readonly Readonly<{
    action: string;
    count: number;
  }>[];
  affectedSurfaceCounts: Readonly<Record<string, number>>;
  rebuildFailureCount: number | null;
}>;

export type JournalAdminOperationSummary = Readonly<{
  operationRef: string;
  kind: string;
  state: string;
  outcomeCode: string;
  applicationVersion: string | null;
  safeCounts: Readonly<Record<string, number>>;
  startedAtUtc: string;
  completedAtUtc: string | null;
}>;

export type JournalAdminSystemStatus = Readonly<{
  coverage: JournalAdminCoverage;
  application: Readonly<{
    environment: "local" | "preview" | "production";
    version: string | null;
  }>;
  schema: Readonly<{
    migrationCount: number;
    latestMigrationId: string | null;
    schemaDigest: string | null;
    driftState: "verified_at_open";
  }>;
  storage: Readonly<{
    databaseBytes: number | null;
    walBytes: number | null;
    volumeTotalBytes: number | null;
    volumeFreeBytes: number | null;
    note: string | null;
  }>;
  processing: Readonly<{
    machineProcessingCount: number;
    userWaitingCount: number;
    oldestMachineProcessingAtUtc: string | null;
    completedDurationP50Ms: number | null;
    completedDurationP95Ms: number | null;
  }>;
  discord: Readonly<{
    guildConfigured: boolean;
    applicationConfigured: boolean;
    clientSecretConfigured: boolean;
    publicLoginReady: boolean;
  }>;
  unresolvedOperationalFailureCount: number;
  latestOperations: readonly JournalAdminOperationSummary[];
}>;

export type JournalAdminAuditItem = Readonly<{
  auditRef: string;
  actorKind: string;
  actorDisplayName: string | null;
  actorRole: string;
  action: string;
  targetKind: string;
  outcome: string;
  reasonCode: string;
  details: Readonly<Record<string, string | number | boolean | null>>;
  createdAtUtc: string;
}>;

export type JournalAdminSensitiveAccessReason =
  | "owner_support_review"
  | "importer_diagnostics"
  | "security_review"
  | "data_integrity_review";
