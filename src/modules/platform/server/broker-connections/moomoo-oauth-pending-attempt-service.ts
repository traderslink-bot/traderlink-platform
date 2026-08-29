import "server-only";

import { createHash } from "node:crypto";

import type Database from "better-sqlite3";

import type { WorkspaceAccessScope } from "../../contracts/workspace-access-scope";
import { createCanonicalUtcTimestamp } from "../database/platform-migration-contract";
import { createMoomooPkce } from "./moomoo-oauth";
import { MoomooOAuthPendingAttemptRepository } from "./moomoo-oauth-pending-attempt-repository";

const ATTEMPT_TTL_MILLISECONDS = 10 * 60 * 1000;
const STATE_PATTERN = /^[A-Za-z0-9_-]{32}$/u;
const VERIFIER_PATTERN = /^[A-Za-z0-9_-]{64}$/u;

export type MoomooOAuthPendingOutcome =
  | "oauth_start_created"
  | "oauth_start_reused"
  | "oauth_callback_consumed";

type PendingAttemptIdentity = Readonly<{
  scope: WorkspaceAccessScope;
  platformSessionId: string | null;
}>;

type PkceBinding = Readonly<{
  state: string;
  verifier: string;
  challenge: string;
}>;

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function restorePkce(state: string | null, verifier: string | null): PkceBinding | null {
  if (!state || !verifier || !STATE_PATTERN.test(state) || !VERIFIER_PATTERN.test(verifier)) {
    return null;
  }
  return Object.freeze({
    state,
    verifier,
    challenge: createHash("sha256").update(verifier, "utf8").digest("base64url"),
  });
}

export function recordMoomooOAuthPendingOutcome(outcome: MoomooOAuthPendingOutcome): void {
  console.info("TraderLink Moomoo OAuth pending attempt.", JSON.stringify({ outcome }));
}

export class MoomooOAuthPendingAttemptService {
  private readonly repository: MoomooOAuthPendingAttemptRepository;

  constructor(
    database: Database.Database,
    private readonly now: () => Date = () => new Date(),
  ) {
    this.repository = new MoomooOAuthPendingAttemptRepository(database);
  }

  prepare(input: PendingAttemptIdentity & Readonly<{
    cookieState: string | null;
    cookieVerifier: string | null;
  }>): Readonly<PkceBinding & { outcome: "oauth_start_created" | "oauth_start_reused" }> {
    const now = this.now();
    const nowUtc = createCanonicalUtcTimestamp(now);
    this.repository.deleteExpired(nowUtc);
    const reusable = restorePkce(input.cookieState, input.cookieVerifier);
    if (reusable && this.repository.isPendingBound({
      scope: input.scope,
      platformSessionId: input.platformSessionId,
      stateSha256: sha256(reusable.state),
      nowUtc,
    })) {
      return Object.freeze({ ...reusable, outcome: "oauth_start_reused" as const });
    }

    const created = createMoomooPkce();
    this.repository.create({
      scope: input.scope,
      platformSessionId: input.platformSessionId,
      stateSha256: sha256(created.state),
      createdAtUtc: nowUtc,
      expiresAtUtc: createCanonicalUtcTimestamp(new Date(now.getTime() + ATTEMPT_TTL_MILLISECONDS)),
    });
    return Object.freeze({ ...created, outcome: "oauth_start_created" as const });
  }

  consume(input: PendingAttemptIdentity & Readonly<{ state: string }>): boolean {
    if (!STATE_PATTERN.test(input.state)) return false;
    const consumedAtUtc = createCanonicalUtcTimestamp(this.now());
    return this.repository.consume({
      scope: input.scope,
      platformSessionId: input.platformSessionId,
      stateSha256: sha256(input.state),
      consumedAtUtc,
    });
  }
}
