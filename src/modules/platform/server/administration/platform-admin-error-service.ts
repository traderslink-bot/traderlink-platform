import "server-only";

import {
  journalAdminCoverage,
  journalAdminReference,
  parseSafeCountObject,
  type JournalAdminReadContext,
} from "@/src/modules/journal/server/administration/journal-admin-read-helpers";

type ErrorRow = Readonly<{
  operational_event_id: string;
  outcome_code: string;
  safe_counts_json: string;
  created_at_utc: string;
}>;

export type PlatformAdminErrorItem = Readonly<{
  errorRef: string;
  source: string;
  operation: string;
  failure: string;
  safeCounts: Readonly<Record<string, number>>;
  occurredAtUtc: string;
}>;

export type PlatformAdminErrorStatus = Readonly<{
  coverage: ReturnType<typeof journalAdminCoverage>;
  last24Hours: number;
  last7Days: number;
  sourceCount: number;
  latestAtUtc: string | null;
  errors: readonly PlatformAdminErrorItem[];
}>;

const MOOMOO_STAGES = Object.freeze([
  "incremental_schedule",
  "account_discovery",
  "oauth_callback",
  "import_status",
  "import_start",
  "account_link",
  "oauth_start",
  "oauth_state",
  "disconnect",
  "worker",
] as const);

function humanize(value: string): string {
  return value.replaceAll("_", " ").replace(/^\w/u, (character) => character.toUpperCase());
}

function describeOutcome(outcomeCode: string): Readonly<{
  source: string;
  operation: string;
  failure: string;
}> {
  if (outcomeCode.startsWith("moomoo_")) {
    const suffix = outcomeCode.slice("moomoo_".length);
    const stage = MOOMOO_STAGES.find((candidate) =>
      suffix === candidate || suffix.startsWith(`${candidate}_`));
    if (stage) {
      const reason = suffix.slice(stage.length).replace(/^_/u, "") || "unexpected";
      return Object.freeze({
        source: "Moomoo",
        operation: humanize(stage),
        failure: humanize(reason),
      });
    }
  }
  return Object.freeze({
    source: "TraderLink",
    operation: "Application",
    failure: "Unavailable",
  });
}

export class PlatformAdminErrorService {
  constructor(private readonly context: JournalAdminReadContext) {}

  recentFailureCount(hours = 24): number {
    const since = new Date(this.context.now.getTime() - hours * 60 * 60 * 1000)
      .toISOString();
    return this.context.database.prepare<[string], { count: number }>(`SELECT COUNT(*) AS count
FROM platform_operational_events
WHERE state = 'failed' AND outcome_code GLOB 'moomoo_*'
  AND created_at_utc >= ?`).get(since)!.count;
  }

  read(limit = 100): PlatformAdminErrorStatus {
    const safeLimit = Number.isSafeInteger(limit) && limit >= 1 && limit <= 500 ? limit : 100;
    const last24Hours = this.recentFailureCount(24);
    const last7Days = this.recentFailureCount(24 * 7);
    const rows = this.context.database.prepare<[number], ErrorRow>(`SELECT
  operational_event_id, outcome_code, safe_counts_json, created_at_utc
FROM platform_operational_events
WHERE state = 'failed' AND outcome_code GLOB 'moomoo_*'
ORDER BY created_at_utc DESC, operational_event_id DESC
LIMIT ?`).all(safeLimit);
    const errors = rows.map((row): PlatformAdminErrorItem => {
      const description = describeOutcome(row.outcome_code);
      return Object.freeze({
        errorRef: journalAdminReference(this.context, "operational_event", row.operational_event_id),
        ...description,
        safeCounts: parseSafeCountObject(row.safe_counts_json),
        occurredAtUtc: row.created_at_utc,
      });
    });
    return Object.freeze({
      coverage: journalAdminCoverage(this.context),
      last24Hours,
      last7Days,
      sourceCount: errors.length > 0 ? new Set(errors.map((item) => item.source)).size : 0,
      latestAtUtc: errors[0]?.occurredAtUtc ?? null,
      errors: Object.freeze(errors),
    });
  }
}
