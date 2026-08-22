import { createHash, randomBytes } from "node:crypto";

import {
  createCanonicalUtcTimestamp,
  createCanonicalUuidV4,
  platformFailure,
} from "../database/platform-migration-contract";
import {
  PlatformSessionRepository,
  type PlatformSessionRecord,
  type ResolvedPlatformSession,
} from "./platform-session-repository";

export const TRADERLINK_PLATFORM_SESSION_COOKIE = "tl_platform_session";
export const TRADERLINK_PLATFORM_SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1_000;
const TRADERLINK_PLATFORM_SESSION_TOUCH_INTERVAL_MS = 5 * 60 * 1_000;

export type CreatedPlatformSession = Readonly<{
  token: string;
  session: PlatformSessionRecord;
}>;

export function hashPlatformSessionToken(token: string): string {
  if (!/^[A-Za-z0-9_-]{43}$/u.test(token)) {
    platformFailure("TRADERLINK_AUTH_SESSION_INVALID");
  }
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export class PlatformSessionService {
  constructor(
    private readonly repository: PlatformSessionRepository,
    private readonly dependencies: Readonly<{
      now?: () => Date;
      createId?: () => string;
      createToken?: () => string;
      ttlMs?: number;
    }> = {},
  ) {}

  createForIdentity(input: Readonly<{
    userId: string;
    authProvider: string;
    authSubject: string;
  }>): CreatedPlatformSession {
    const now = this.dependencies.now?.() ?? new Date();
    const createdAtUtc = createCanonicalUtcTimestamp(now);
    const ttlMs = this.dependencies.ttlMs ?? TRADERLINK_PLATFORM_SESSION_TTL_MS;
    if (!Number.isSafeInteger(ttlMs) || ttlMs < 60_000) {
      platformFailure("TRADERLINK_AUTH_SESSION_INVALID");
    }
    const expiresAtUtc = createCanonicalUtcTimestamp(
      new Date(now.getTime() + ttlMs),
    );
    const token = this.dependencies.createToken?.() ?? randomBytes(32).toString("base64url");
    const session = this.repository.createSession({
      sessionId: this.dependencies.createId?.() ?? createCanonicalUuidV4(),
      userId: input.userId,
      authProvider: input.authProvider,
      authSubject: input.authSubject,
      tokenSha256: hashPlatformSessionToken(token),
      createdAtUtc,
      expiresAtUtc,
    });
    return Object.freeze({ token, session });
  }

  resolve(token: string | null | undefined): ResolvedPlatformSession | null {
    if (!token) return null;
    let tokenSha256: string;
    try {
      tokenSha256 = hashPlatformSessionToken(token);
    } catch {
      return null;
    }
    const nowUtc = createCanonicalUtcTimestamp(
      this.dependencies.now?.() ?? new Date(),
    );
    const session = this.repository.findActiveByTokenDigest(tokenSha256, nowUtc);
    if (!session) return null;
    if (
      Date.parse(nowUtc) - Date.parse(session.lastSeenAtUtc) >=
      TRADERLINK_PLATFORM_SESSION_TOUCH_INTERVAL_MS
    ) {
      this.repository.touchActiveSession({
        sessionId: session.sessionId,
        timestamp: nowUtc,
      });
      return Object.freeze({ ...session, lastSeenAtUtc: nowUtc });
    }
    return session;
  }

  revoke(token: string | null | undefined): boolean {
    if (!token) return false;
    let tokenSha256: string;
    try {
      tokenSha256 = hashPlatformSessionToken(token);
    } catch {
      return false;
    }
    return this.repository.revokeByTokenDigest({
      tokenSha256,
      timestamp: createCanonicalUtcTimestamp(
        this.dependencies.now?.() ?? new Date(),
      ),
    });
  }

  countActiveForUser(userId: string): number {
    return this.repository.countActiveForUser(
      userId,
      createCanonicalUtcTimestamp(this.dependencies.now?.() ?? new Date()),
    );
  }

  revokeAllForUser(userId: string): number {
    const timestamp = createCanonicalUtcTimestamp(
      this.dependencies.now?.() ?? new Date(),
    );
    return this.repository.revokeActiveForUser({ userId, timestamp });
  }
}
