import type {
  SessionBucket,
  SessionContextInput,
  SessionExposureSegment,
} from "../types/session-context";

export const MARKET_TIME_ZONE = "America/New_York";

export interface EasternSessionClassification {
  sessionBucket: SessionBucket;
  sessionDateEt: string;
  timeEt: string;
  hourEt: number;
  hourLabelEt: string;
}

interface EasternDateTimeParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

function round(value: number, decimals = 6): number {
  return Number(value.toFixed(decimals));
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function formatSessionDate(parts: EasternDateTimeParts): string {
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
}

function formatTime(parts: EasternDateTimeParts): string {
  return `${formatSessionDate(parts)} ${pad(parts.hour)}:${pad(parts.minute)}:${pad(
    parts.second,
  )} ET`;
}

function hourLabel(hour: number): string {
  return `${pad(hour)}:00-${pad(hour)}:59 ET`;
}

function easternParts(date: Date): EasternDateTimeParts {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: MARKET_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const values = new Map(parts.map((part) => [part.type, part.value]));

  return {
    year: Number(values.get("year")),
    month: Number(values.get("month")),
    day: Number(values.get("day")),
    hour: Number(values.get("hour")),
    minute: Number(values.get("minute")),
    second: Number(values.get("second")),
  };
}

function timeZoneOffsetMillis(date: Date): number {
  const parts = easternParts(date);
  const localAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );

  return localAsUtc - date.getTime();
}

function easternLocalPartsToUtc(parts: EasternDateTimeParts): number {
  const localAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );
  const firstOffset = timeZoneOffsetMillis(new Date(localAsUtc));
  const firstUtc = localAsUtc - firstOffset;
  const secondOffset = timeZoneOffsetMillis(new Date(firstUtc));

  return localAsUtc - secondOffset;
}

function addLocalMinutes(
  parts: EasternDateTimeParts,
  minutesToAdd: number,
): EasternDateTimeParts {
  const localDate = new Date(
    Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute + minutesToAdd,
      0,
    ),
  );

  return {
    year: localDate.getUTCFullYear(),
    month: localDate.getUTCMonth() + 1,
    day: localDate.getUTCDate(),
    hour: localDate.getUTCHours(),
    minute: localDate.getUTCMinutes(),
    second: localDate.getUTCSeconds(),
  };
}

function bucketForMinutes(minutesOfDay: number): SessionBucket {
  if (minutesOfDay >= 20 * 60 || minutesOfDay < 4 * 60) {
    return "overnight";
  }

  if (minutesOfDay < 9 * 60 + 30) {
    return "pre_market";
  }

  if (minutesOfDay < 11 * 60) {
    return "market_open";
  }

  if (minutesOfDay < 16 * 60) {
    return "midday";
  }

  return "post_market";
}

function nextSessionBoundaryMinutes(minutesOfDay: number): number {
  if (minutesOfDay < 4 * 60) {
    return 4 * 60;
  }

  if (minutesOfDay < 9 * 60 + 30) {
    return 9 * 60 + 30;
  }

  if (minutesOfDay < 11 * 60) {
    return 11 * 60;
  }

  if (minutesOfDay < 16 * 60) {
    return 16 * 60;
  }

  if (minutesOfDay < 20 * 60) {
    return 20 * 60;
  }

  return 28 * 60;
}

function localMinutes(parts: EasternDateTimeParts): number {
  return parts.hour * 60 + parts.minute + parts.second / 60;
}

function nextBoundaryUtc(timestampMs: number): number {
  const parts = easternParts(new Date(timestampMs));
  const minutes = localMinutes(parts);
  const nextHour = addLocalMinutes(parts, 60 - parts.minute);
  const nextSessionBoundary = nextSessionBoundaryMinutes(minutes);
  const minutesUntilSessionBoundary =
    nextSessionBoundary > minutes
      ? nextSessionBoundary - minutes
      : nextSessionBoundary + 24 * 60 - minutes;
  const sessionBoundary = addLocalMinutes(parts, minutesUntilSessionBoundary);
  const nextHourUtc = easternLocalPartsToUtc({
    ...nextHour,
    second: 0,
  });
  const nextSessionUtc = easternLocalPartsToUtc({
    ...sessionBoundary,
    second: 0,
  });
  const candidates = [nextHourUtc, nextSessionUtc].filter(
    (candidate) => candidate > timestampMs,
  );

  return Math.min(...candidates);
}

export function classifyEasternSessionTime(
  timestamp: string | number | Date,
): EasternSessionClassification | null {
  const parsed =
    timestamp instanceof Date
      ? timestamp.getTime()
      : typeof timestamp === "number"
        ? timestamp
        : Date.parse(timestamp);

  if (!Number.isFinite(parsed) || Number.isNaN(parsed)) {
    return null;
  }

  const parts = easternParts(new Date(parsed));
  const minutesOfDay = parts.hour * 60 + parts.minute;

  return {
    sessionBucket: bucketForMinutes(minutesOfDay),
    sessionDateEt: formatSessionDate(parts),
    timeEt: formatTime(parts),
    hourEt: parts.hour,
    hourLabelEt: hourLabel(parts.hour),
  };
}

function uniqueInOrder<T>(values: T[]): T[] {
  const seen = new Set<T>();
  const result: T[] = [];

  for (const value of values) {
    if (seen.has(value)) {
      continue;
    }

    seen.add(value);
    result.push(value);
  }

  return result;
}

export function buildSessionExposureSegments(args: {
  startTimestamp: string;
  endTimestamp: string;
}): SessionExposureSegment[] {
  const startMs = Date.parse(args.startTimestamp);
  const endMs = Date.parse(args.endTimestamp);

  if (Number.isNaN(startMs) || Number.isNaN(endMs)) {
    return [];
  }

  const orderedStart = Math.min(startMs, endMs);
  const orderedEnd = Math.max(startMs, endMs);
  const segments: SessionExposureSegment[] = [];
  let cursor = orderedStart;

  while (cursor <= orderedEnd) {
    const classification = classifyEasternSessionTime(cursor);

    if (!classification) {
      break;
    }

    const boundary = cursor === orderedEnd ? orderedEnd : nextBoundaryUtc(cursor);
    const segmentEnd = Math.min(boundary, orderedEnd);

    segments.push({
      sessionBucket: classification.sessionBucket,
      sessionDateEt: classification.sessionDateEt,
      hourEt: classification.hourEt,
      hourLabelEt: classification.hourLabelEt,
      startTimestamp: new Date(cursor).toISOString(),
      endTimestamp: new Date(segmentEnd).toISOString(),
      durationMinutes: round((segmentEnd - cursor) / 60000),
    });

    if (segmentEnd >= orderedEnd) {
      break;
    }

    cursor = segmentEnd;
  }

  return segments;
}

export function buildSessionTimeContextFromExecutions(
  executions: Array<{ timestamp: string | number | Date }>,
): Pick<
  SessionContextInput,
  | "sessionBucket"
  | "sessionDate"
  | "entrySessionBucket"
  | "entrySessionDateEt"
  | "entryTimeEt"
  | "entryHourEt"
  | "entryHourLabelEt"
  | "sessionExposure"
  | "heldSessionBuckets"
  | "heldHourBucketsEt"
  | "heldPremarketIntoOpen"
  | "heldOpenIntoMidday"
  | "heldMiddayIntoPostmarket"
  | "heldPostmarketIntoOvernight"
  | "heldOvernight"
> {
  const ordered = [...executions].sort(
    (left, right) =>
      Date.parse(String(left.timestamp)) - Date.parse(String(right.timestamp)),
  );
  const first = ordered[0];
  const last = ordered[ordered.length - 1] ?? first;
  const entry = first ? classifyEasternSessionTime(first.timestamp) : null;

  if (!first || !last || !entry) {
    return {
      sessionBucket: "unknown",
      sessionDate: "1970-01-01",
      entryHourEt: null,
      sessionExposure: [],
      heldSessionBuckets: [],
      heldHourBucketsEt: [],
      heldPremarketIntoOpen: false,
      heldOpenIntoMidday: false,
      heldMiddayIntoPostmarket: false,
      heldPostmarketIntoOvernight: false,
      heldOvernight: false,
    };
  }

  const exposure = buildSessionExposureSegments({
    startTimestamp: String(first.timestamp),
    endTimestamp: String(last.timestamp),
  });
  const heldSessionBuckets = uniqueInOrder(
    exposure.map((segment) => segment.sessionBucket),
  );
  const heldHourBucketsEt = uniqueInOrder(
    exposure.map((segment) => segment.hourLabelEt),
  );
  const heldSet = new Set(heldSessionBuckets);

  return {
    sessionBucket: entry.sessionBucket,
    sessionDate: entry.sessionDateEt,
    entrySessionBucket: entry.sessionBucket,
    entrySessionDateEt: entry.sessionDateEt,
    entryTimeEt: entry.timeEt,
    entryHourEt: entry.hourEt,
    entryHourLabelEt: entry.hourLabelEt,
    sessionExposure: exposure,
    heldSessionBuckets,
    heldHourBucketsEt,
    heldPremarketIntoOpen:
      heldSet.has("pre_market") && heldSet.has("market_open"),
    heldOpenIntoMidday:
      heldSet.has("market_open") && heldSet.has("midday"),
    heldMiddayIntoPostmarket:
      heldSet.has("midday") && heldSet.has("post_market"),
    heldPostmarketIntoOvernight:
      heldSet.has("post_market") && heldSet.has("overnight"),
    heldOvernight: heldSet.has("overnight"),
  };
}
