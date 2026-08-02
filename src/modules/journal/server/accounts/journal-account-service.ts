import { createHmac, timingSafeEqual } from "node:crypto";

import type {
  AccountScope,
  WorkspaceAccessScope,
} from "@/src/modules/platform/contracts/workspace-access-scope";
import {
  narrowWorkspaceAccessToAccount,
} from "@/src/modules/platform/contracts/workspace-access-scope";
import {
  assertCanonicalUuidV4,
  assertLowercaseToken,
  createCanonicalUtcTimestamp,
  createCanonicalUuidV4,
  platformFailure,
} from "@/src/modules/platform/server/database/platform-migration-contract";

import {
  type JournalAccountRecord,
  JournalAccountRepository,
  type JournalAccountSourceIdentityRecord,
  type SourceIdentityFingerprintTuple,
} from "./journal-account-repository";

export const ACCOUNT_FINGERPRINT_SCHEME_VERSION = "hmac-sha256-v1" as const;

export type ResolvedJournalSourceIdentity = Readonly<{
  accountId: string;
  workspaceId: string;
  tradingTimezone: string;
  sourceIdentityId: string;
}>;

export type JournalSourceIdentityTarget = Readonly<{
  accountId: string;
  tradingTimezone: string;
}>;

export type SourceAccountCanonicalizer = (rawSourceAccountId: string) => string;

export type AccountIdentityConfiguration = Readonly<{
  activeKeyVersion: string;
  keysBase64: Readonly<Record<string, string>>;
  activeCanonicalizationVersion: string;
  canonicalizers: Readonly<Record<string, SourceAccountCanonicalizer>>;
}>;

type ValidatedIdentityConfiguration = Readonly<{
  activeKeyVersion: string;
  keys: ReadonlyMap<string, Buffer>;
  activeCanonicalizationVersion: string;
  canonicalizers: ReadonlyMap<string, SourceAccountCanonicalizer>;
}>;

function validateIdentityConfiguration(
  configuration: AccountIdentityConfiguration | undefined,
): ValidatedIdentityConfiguration {
  if (!configuration) {
    platformFailure("TRADERLINK_ACCOUNT_IDENTITY_CONFIGURATION_INVALID");
  }
  assertLowercaseToken(configuration.activeKeyVersion, "activeKeyVersion");
  assertLowercaseToken(
    configuration.activeCanonicalizationVersion,
    "activeCanonicalizationVersion",
  );
  const keys = new Map<string, Buffer>();
  for (const [version, encoded] of Object.entries(configuration.keysBase64)) {
    assertLowercaseToken(version, "hmacKeyVersion");
    const decoded = Buffer.from(encoded, "base64");
    if (decoded.length < 32 || decoded.toString("base64") !== encoded) {
      platformFailure("TRADERLINK_ACCOUNT_IDENTITY_CONFIGURATION_INVALID");
    }
    keys.set(version, decoded);
  }
  const canonicalizers = new Map(
    Object.entries(configuration.canonicalizers),
  );
  for (const [version, canonicalizer] of canonicalizers) {
    assertLowercaseToken(version, "canonicalizationVersion");
    if (typeof canonicalizer !== "function") {
      platformFailure("TRADERLINK_ACCOUNT_IDENTITY_CONFIGURATION_INVALID");
    }
  }
  if (
    !keys.has(configuration.activeKeyVersion) ||
    !canonicalizers.has(configuration.activeCanonicalizationVersion)
  ) {
    platformFailure("TRADERLINK_ACCOUNT_IDENTITY_CONFIGURATION_INVALID");
  }
  return Object.freeze({
    activeKeyVersion: configuration.activeKeyVersion,
    keys,
    activeCanonicalizationVersion: configuration.activeCanonicalizationVersion,
    canonicalizers,
  });
}

export function loadAccountIdentityConfiguration(
  environment: NodeJS.ProcessEnv = process.env,
  canonicalizers: Readonly<Record<string, SourceAccountCanonicalizer>>,
  activeCanonicalizationVersion: string,
): AccountIdentityConfiguration {
  const keysJson = environment.TRADERLINK_PLATFORM_ACCOUNT_IDENTITY_HMAC_KEYS_JSON;
  const activeKeyVersion =
    environment.TRADERLINK_PLATFORM_ACCOUNT_IDENTITY_ACTIVE_KEY_VERSION;
  if (!keysJson || !activeKeyVersion) {
    platformFailure("TRADERLINK_ACCOUNT_IDENTITY_CONFIGURATION_INVALID");
  }
  let keysBase64: Record<string, string>;
  try {
    const parsed: unknown = JSON.parse(keysJson);
    if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") throw new Error();
    keysBase64 = Object.fromEntries(
      Object.entries(parsed).map(([key, value]) => {
        if (typeof value !== "string") throw new Error();
        return [key, value];
      }),
    );
  } catch {
    platformFailure("TRADERLINK_ACCOUNT_IDENTITY_CONFIGURATION_INVALID");
  }
  const configuration = {
    activeKeyVersion,
    keysBase64,
    canonicalizers,
    activeCanonicalizationVersion,
  };
  validateIdentityConfiguration(configuration);
  return Object.freeze(configuration);
}

export function calculateSourceAccountFingerprint(input: Readonly<{
  sourceSystem: string;
  canonicalizationVersion: string;
  hmacKeyVersion: string;
  canonicalSourceAccountId: string;
  key: Buffer;
}>): string {
  const content = [
    "traderlink-account-fingerprint-v1",
    input.sourceSystem,
    input.canonicalizationVersion,
    input.hmacKeyVersion,
    input.canonicalSourceAccountId,
  ].join("\u001f");
  return createHmac("sha256", input.key).update(content, "utf8").digest("hex");
}

function requireWorkspaceManager(
  scope: WorkspaceAccessScope,
  workspaceId: string,
): void {
  assertCanonicalUuidV4(workspaceId, "workspaceId");
  if (
    scope.workspaceId !== workspaceId ||
    (scope.workspaceRole !== "owner" && scope.workspaceRole !== "admin")
  ) {
    platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
  }
}

function requireIanaTimezone(value: string): void {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value }).format(0);
  } catch {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
      field: "tradingTimezone",
    });
  }
}

function requireIsoCurrency(value: string): void {
  if (!Intl.supportedValuesOf("currency").includes(value)) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
      field: "baseCurrency",
    });
  }
}

function privacyComparisonForms(
  value: string,
  rejectMalformedPercentEscapes = false,
): readonly string[] {
  const normalized = value.normalize("NFKC").toLowerCase();
  const decodedForms = [normalized];
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const current = decodedForms.at(-1) ?? normalized;
    if (/%(?![0-9a-f]{2})/iu.test(current)) {
      if (rejectMalformedPercentEscapes) {
        platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
          field: "privacySafeDisplay",
        });
      }
      break;
    }
    try {
      const decoded = decodeURIComponent(current)
        .normalize("NFKC")
        .toLowerCase();
      if (decoded === current) break;
      decodedForms.push(decoded);
    } catch {
      if (rejectMalformedPercentEscapes) {
        platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
          field: "privacySafeDisplay",
        });
      }
      break;
    }
  }
  return Object.freeze([...new Set(decodedForms
    .flatMap((candidate) => [candidate, candidate.replace(/[^\p{L}\p{N}]/gu, "")])
    .filter((candidate) => candidate.length > 0))]);
}

function containsPrivateAccountToken(
  candidate: string,
  privateTokens: readonly string[],
): boolean {
  const candidateForms = privacyComparisonForms(candidate, true);
  const tokenForms = privateTokens.flatMap((token) =>
    privacyComparisonForms(token));
  return candidateForms.some((candidateForm) =>
    tokenForms.some((tokenForm) => candidateForm.includes(tokenForm)));
}

function equalHexDigest(left: string, right: string): boolean {
  if (!/^[0-9a-f]{64}$/u.test(left) || !/^[0-9a-f]{64}$/u.test(right)) return false;
  return timingSafeEqual(Buffer.from(left, "hex"), Buffer.from(right, "hex"));
}

function resolvedIdentityResult(
  account: JournalAccountRecord,
  sourceIdentity: JournalAccountSourceIdentityRecord,
): ResolvedJournalSourceIdentity {
  return Object.freeze({
    accountId: account.accountId,
    workspaceId: account.workspaceId,
    tradingTimezone: account.tradingTimezone,
    sourceIdentityId: sourceIdentity.sourceIdentityId,
  });
}

export class JournalAccountService {
  constructor(
    private readonly repository: JournalAccountRepository,
    private readonly identityConfiguration?: AccountIdentityConfiguration,
  ) {}

  listActiveAccountIdsForWorkspace(workspaceId: string): readonly string[] {
    return Object.freeze(
      this.repository.listActiveAccounts(workspaceId).map((account) => account.accountId),
    );
  }

  createAccount(
    scope: WorkspaceAccessScope,
    input: Readonly<{
      workspaceId: string;
      displayName: string;
      baseCurrency: string;
      tradingTimezone: string;
      accountId?: string;
      now?: Date;
    }>,
  ): JournalAccountRecord {
    requireWorkspaceManager(scope, input.workspaceId);
    if (
      input.displayName.trim() !== input.displayName ||
      input.displayName.length < 1 ||
      input.displayName.length > 120 ||
      /[\u0000-\u001f\u007f]/u.test(input.displayName)
    ) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
        field: "displayName",
      });
    }
    requireIsoCurrency(input.baseCurrency);
    requireIanaTimezone(input.tradingTimezone);
    const timestamp = createCanonicalUtcTimestamp(input.now);
    const accountId = input.accountId ?? createCanonicalUuidV4();
    assertCanonicalUuidV4(accountId, "accountId");
    return this.repository.createAccount(
      Object.freeze({
        accountId,
        workspaceId: input.workspaceId,
        displayName: input.displayName,
        baseCurrency: input.baseCurrency,
        tradingTimezone: input.tradingTimezone,
        status: "active",
        createdByUserId: scope.userId,
        createdAtUtc: timestamp,
        updatedAtUtc: timestamp,
      }),
    );
  }

  requireAccountScope(
    scope: WorkspaceAccessScope,
    accountId: string,
  ): AccountScope {
    const accountScope = narrowWorkspaceAccessToAccount(scope, accountId);
    this.requireAccountRecord(scope, accountId);
    return accountScope;
  }

  requireAccountRecord(
    scope: WorkspaceAccessScope,
    accountId: string,
  ): JournalAccountRecord {
    narrowWorkspaceAccessToAccount(scope, accountId);
    const account = this.repository.findActiveAccount(scope.workspaceId, accountId);
    if (!account) platformFailure("TRADERLINK_ACCOUNT_NOT_FOUND");
    return account;
  }

  private buildFingerprintTuples(
    identities: readonly JournalAccountSourceIdentityRecord[],
    sourceSystem: string,
    rawSourceAccountId: string,
  ): readonly SourceIdentityFingerprintTuple[] {
    const configuration = validateIdentityConfiguration(this.identityConfiguration);
    for (const identity of identities) {
      if (
        !configuration.keys.has(identity.hmacKeyVersion) ||
        !configuration.canonicalizers.has(
          identity.sourceAccountCanonicalizationVersion,
        )
      ) {
        platformFailure("TRADERLINK_ACCOUNT_IDENTITY_RECOVERY_REQUIRED");
      }
    }
    const tuples: SourceIdentityFingerprintTuple[] = [];
    for (const [canonicalizationVersion, canonicalizer] of configuration.canonicalizers) {
      const canonicalSourceAccountId = canonicalizer(rawSourceAccountId);
      if (canonicalSourceAccountId.length === 0) {
        platformFailure("TRADERLINK_ACCOUNT_IDENTITY_RECOVERY_REQUIRED");
      }
      for (const [hmacKeyVersion, key] of configuration.keys) {
        tuples.push(
          Object.freeze({
            canonicalizationVersion,
            hmacKeyVersion,
            fingerprint: calculateSourceAccountFingerprint({
              sourceSystem,
              canonicalizationVersion,
              hmacKeyVersion,
              canonicalSourceAccountId,
              key,
            }),
          }),
        );
      }
    }
    return Object.freeze(tuples);
  }

  resolveSourceAccountIdentity(
    scope: WorkspaceAccessScope,
    input: Readonly<{
      sourceSystem: string;
      rawSourceAccountId: string;
      privacySafeDisplay: string;
      sourceAccountCanonicalizationVersion?: string;
      now?: Date;
    }>,
  ): ResolvedJournalSourceIdentity {
    return this.resolveSourceAccountIdentityRecord(scope, input);
  }

  inspectSourceAccountIdentity(
    scope: WorkspaceAccessScope,
    input: Readonly<{
      sourceSystem: string;
      rawSourceAccountId: string;
    }>,
  ): JournalSourceIdentityTarget {
    requireWorkspaceManager(scope, scope.workspaceId);
    assertLowercaseToken(input.sourceSystem, "sourceSystem");
    const identities = this.repository.listNonSupersededSourceIdentities(
      scope.workspaceId,
      input.sourceSystem,
    );
    const tuples = this.buildFingerprintTuples(
      identities,
      input.sourceSystem,
      input.rawSourceAccountId,
    );
    const matches = this.repository.findSourceIdentityMatches(
      scope.workspaceId,
      input.sourceSystem,
      tuples,
    );
    const accountIds = new Set(matches.map((match) => match.accountId));
    if (accountIds.size === 0) {
      platformFailure("TRADERLINK_ACCOUNT_IDENTITY_CONFIRMATION_REQUIRED");
    }
    if (accountIds.size > 1) {
      platformFailure("TRADERLINK_ACCOUNT_IDENTITY_CONFLICT");
    }
    const accountId = [...accountIds][0];
    this.requireAccountScope(scope, accountId);
    const account = this.repository.findActiveAccount(scope.workspaceId, accountId);
    if (!account) platformFailure("TRADERLINK_ACCOUNT_NOT_FOUND");
    return Object.freeze({
      accountId: account.accountId,
      tradingTimezone: account.tradingTimezone,
    });
  }

  resolveSourceAccountIdentityRecord(
    scope: WorkspaceAccessScope,
    input: Readonly<{
      sourceSystem: string;
      rawSourceAccountId: string;
      privacySafeDisplay: string;
      sourceAccountCanonicalizationVersion?: string;
      now?: Date;
    }>,
  ): ResolvedJournalSourceIdentity {
    requireWorkspaceManager(scope, scope.workspaceId);
    assertLowercaseToken(input.sourceSystem, "sourceSystem");
    const identities = this.repository.listNonSupersededSourceIdentities(
      scope.workspaceId,
      input.sourceSystem,
    );
    const tuples = this.buildFingerprintTuples(
      identities,
      input.sourceSystem,
      input.rawSourceAccountId,
    );
    const matches = this.repository.findSourceIdentityMatches(
      scope.workspaceId,
      input.sourceSystem,
      tuples,
    );
    const accountIds = new Set(matches.map((match) => match.accountId));
    if (accountIds.size === 0) {
      platformFailure("TRADERLINK_ACCOUNT_IDENTITY_CONFIRMATION_REQUIRED");
    }
    if (accountIds.size > 1) {
      platformFailure("TRADERLINK_ACCOUNT_IDENTITY_CONFLICT");
    }
    const accountId = [...accountIds][0];
    const account = this.repository.findActiveAccount(scope.workspaceId, accountId);
    if (!account) platformFailure("TRADERLINK_ACCOUNT_NOT_FOUND");
    const sourceIdentity = this.writeCurrentIdentity(
      scope,
      account,
      input.sourceSystem,
      input.rawSourceAccountId,
      input.privacySafeDisplay,
      input.sourceAccountCanonicalizationVersion,
      input.now,
    );
    return resolvedIdentityResult(account, sourceIdentity);
  }

  confirmSourceIdentityLink(
    scope: WorkspaceAccessScope,
    input: Readonly<{
      accountId: string;
      sourceSystem: string;
      rawSourceAccountId: string;
      privacySafeDisplay: string;
      sourceAccountCanonicalizationVersion?: string;
      now?: Date;
    }>,
  ): ResolvedJournalSourceIdentity {
    return this.confirmSourceIdentityLinkRecord(scope, input);
  }

  confirmSourceIdentityLinkRecord(
    scope: WorkspaceAccessScope,
    input: Readonly<{
      accountId: string;
      sourceSystem: string;
      rawSourceAccountId: string;
      privacySafeDisplay: string;
      sourceAccountCanonicalizationVersion?: string;
      now?: Date;
    }>,
  ): ResolvedJournalSourceIdentity {
    requireWorkspaceManager(scope, scope.workspaceId);
    const account = this.repository.findActiveAccount(scope.workspaceId, input.accountId);
    if (!account) platformFailure("TRADERLINK_ACCOUNT_NOT_FOUND");
    const identities = this.repository.listNonSupersededSourceIdentities(
      scope.workspaceId,
      input.sourceSystem,
    );
    const tuples = this.buildFingerprintTuples(
      identities,
      input.sourceSystem,
      input.rawSourceAccountId,
    );
    const matches = this.repository.findSourceIdentityMatches(
      scope.workspaceId,
      input.sourceSystem,
      tuples,
    );
    if (matches.some((match) => match.accountId !== input.accountId)) {
      platformFailure("TRADERLINK_ACCOUNT_IDENTITY_CONFLICT");
    }
    const sourceIdentity = this.writeCurrentIdentity(
      scope,
      account,
      input.sourceSystem,
      input.rawSourceAccountId,
      input.privacySafeDisplay,
      input.sourceAccountCanonicalizationVersion,
      input.now,
    );
    return resolvedIdentityResult(account, sourceIdentity);
  }

  assertPrivacySafeSourceMetadata(input: Readonly<{
    rawSourceAccountId: string;
    candidateValues: readonly string[];
  }>): void {
    const configuration = validateIdentityConfiguration(this.identityConfiguration);
    const privateTokens = [
      input.rawSourceAccountId.trim(),
      ...[...configuration.canonicalizers.values()].map((canonicalizer) =>
        canonicalizer(input.rawSourceAccountId)),
    ].filter((value) => value.length > 0);
    if (
      privateTokens.length === 0 ||
      input.candidateValues.some((candidate) =>
        containsPrivateAccountToken(candidate, privateTokens))
    ) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
        field: "privacySafeDisplay",
      });
    }
  }

  private writeCurrentIdentity(
    scope: WorkspaceAccessScope,
    account: JournalAccountRecord,
    sourceSystem: string,
    rawSourceAccountId: string,
    privacySafeDisplay: string,
    sourceAccountCanonicalizationVersion: string | undefined,
    now: Date | undefined,
  ): JournalAccountSourceIdentityRecord {
    requireWorkspaceManager(scope, account.workspaceId);
    assertLowercaseToken(sourceSystem, "sourceSystem");
    const configuration = validateIdentityConfiguration(this.identityConfiguration);
    if (
      privacySafeDisplay.trim() !== privacySafeDisplay ||
      privacySafeDisplay.trim().length < 1 ||
      privacySafeDisplay.trim().length > 120 ||
      /[\u0000-\u001f\u007f]/u.test(privacySafeDisplay)
    ) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
        field: "privacySafeDisplay",
      });
    }
    this.assertPrivacySafeSourceMetadata({
      rawSourceAccountId,
      candidateValues: [privacySafeDisplay],
    });
    const currentCanonicalizationVersion = sourceAccountCanonicalizationVersion ??
      configuration.activeCanonicalizationVersion;
    assertLowercaseToken(
      currentCanonicalizationVersion,
      "sourceAccountCanonicalizationVersion",
    );
    if (!configuration.canonicalizers.has(currentCanonicalizationVersion)) {
      platformFailure("TRADERLINK_ACCOUNT_IDENTITY_CONFIGURATION_INVALID");
    }
    const currentTuple = this.buildFingerprintTuples([], sourceSystem, rawSourceAccountId).find(
      (tuple) =>
        tuple.canonicalizationVersion === currentCanonicalizationVersion &&
        tuple.hmacKeyVersion === configuration.activeKeyVersion,
    );
    if (!currentTuple) {
      platformFailure("TRADERLINK_ACCOUNT_IDENTITY_CONFIGURATION_INVALID");
    }
    const timestamp = createCanonicalUtcTimestamp(now);
    return this.repository.immediate(() => {
      const lockedIdentities = this.repository.listNonSupersededSourceIdentities(
        account.workspaceId,
        sourceSystem,
      );
      const lockedTuples = this.buildFingerprintTuples(
        lockedIdentities,
        sourceSystem,
        rawSourceAccountId,
      );
      const lockedMatches = this.repository.findSourceIdentityMatches(
        account.workspaceId,
        sourceSystem,
        lockedTuples,
      );
      if (lockedMatches.some((match) => match.accountId !== account.accountId)) {
        platformFailure("TRADERLINK_ACCOUNT_IDENTITY_CONFLICT");
      }
      let current = lockedMatches.find(
        (match) =>
          match.accountId === account.accountId &&
          match.sourceAccountCanonicalizationVersion ===
            currentTuple.canonicalizationVersion &&
          match.hmacKeyVersion === currentTuple.hmacKeyVersion &&
          equalHexDigest(match.sourceAccountFingerprint, currentTuple.fingerprint),
      );
      if (!current) {
        current = this.repository.createSourceIdentity(
          Object.freeze({
            sourceIdentityId: createCanonicalUuidV4(),
            workspaceId: account.workspaceId,
            accountId: account.accountId,
            sourceSystem,
            fingerprintSchemeVersion: ACCOUNT_FINGERPRINT_SCHEME_VERSION,
            sourceAccountCanonicalizationVersion:
              currentTuple.canonicalizationVersion,
            hmacKeyVersion: currentTuple.hmacKeyVersion,
            sourceAccountFingerprint: currentTuple.fingerprint,
            privacySafeDisplay,
            status: "active_current",
            firstSeenAtUtc: timestamp,
            lastSeenAtUtc: timestamp,
          }),
        );
      } else {
        this.repository.promoteAndTouchIdentity({
          workspaceId: account.workspaceId,
          accountId: account.accountId,
          sourceIdentityId: current.sourceIdentityId,
          updatedAtUtc: timestamp,
        });
      }
      this.repository.markOtherIdentityRowsRetained({
        workspaceId: account.workspaceId,
        accountId: account.accountId,
        sourceSystem,
        currentSourceIdentityId: current.sourceIdentityId,
        updatedAtUtc: timestamp,
      });
      return current;
    });
  }
}
