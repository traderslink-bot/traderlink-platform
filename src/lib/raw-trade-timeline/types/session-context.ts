// 2026-04-12 08:39 AM America/Toronto
// PURPOSE:
// Defines reusable raw session context types for the trade timeline system.
// This file stays strictly factual and interpretation free.

// file name session-context.ts

export type SessionBucket =
  | "overnight"
  | "pre_market"
  | "market_open"
  | "midday"
  | "post_market"
  | "close"
  | "after_hours"
  | "unknown";

export interface SessionExposureSegment {
  sessionBucket: SessionBucket;
  sessionDateEt: string;
  hourEt: number;
  hourLabelEt: string;
  startTimestamp: string;
  endTimestamp: string;
  durationMinutes: number;
}

export interface SessionContextInput {
  sessionBucket: string;
  sessionDate: string;
  entrySessionBucket?: SessionBucket;
  entrySessionDateEt?: string;
  entryTimeEt?: string;
  entryHourEt?: number | null;
  entryHourLabelEt?: string;
  sessionExposure?: SessionExposureSegment[];
  heldSessionBuckets?: SessionBucket[];
  heldHourBucketsEt?: string[];
  heldPremarketIntoOpen?: boolean;
  heldOpenIntoMidday?: boolean;
  heldMiddayIntoPostmarket?: boolean;
  heldPostmarketIntoOvernight?: boolean;
  heldOvernight?: boolean;
}

export interface SessionContext {
  sessionBucket: SessionBucket;
  sessionDate: string;
  entrySessionBucket?: SessionBucket;
  entrySessionDateEt?: string;
  entryTimeEt?: string;
  entryHourEt?: number | null;
  entryHourLabelEt?: string;
  sessionExposure?: SessionExposureSegment[];
  heldSessionBuckets?: SessionBucket[];
  heldHourBucketsEt?: string[];
  heldPremarketIntoOpen?: boolean;
  heldOpenIntoMidday?: boolean;
  heldMiddayIntoPostmarket?: boolean;
  heldPostmarketIntoOvernight?: boolean;
  heldOvernight?: boolean;
}
