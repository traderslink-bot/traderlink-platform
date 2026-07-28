import type { CanonicalUtcTimestamp } from "../../domain/canonical";
import {
  compareExactDecimals,
  validateExactDecimal,
  type CanonicalDecimal,
  type ExactResult,
} from "../../domain/exact";
import { compareCanonicalTimestamps } from "../../domain/foundation";
import type { CanonicalContentDigest } from "../../domain/identity";
import {
  contractFailure,
  finalizeContentAddressedAuthority,
  validateClaimedDigest,
  validateContractKey,
  validateContractRecord,
  validateTimestampValue,
  type AnalyticalContractFailure,
} from "../contracts";
import {
  getExecutionRuleTemplate,
  type ExecutionRuleTemplate,
  type ExecutionRuleTemplateId,
} from "./execution-rule-template-catalog";

export const EXECUTION_RULE_RECORDS_SCHEMA_VERSION =
  "ti_v3_execution_rule_records_v1" as const;

export interface ExecutionRuleOwnerScope {
  readonly userId: string;
  readonly workspaceId: string;
  readonly tradingAccountId: string | null;
}

export interface ExecutionRuleVersion {
  readonly schemaVersion: typeof EXECUTION_RULE_RECORDS_SCHEMA_VERSION;
  readonly ruleVersionId: string;
  readonly ruleInstanceId: string;
  readonly owner: ExecutionRuleOwnerScope;
  readonly versionOrdinal: string;
  readonly templateId: ExecutionRuleTemplateId;
  readonly templateVersion: "v1";
  readonly configuration: Readonly<Record<string, string>>;
  readonly effectiveFrom: CanonicalUtcTimestamp;
  readonly supersedesRuleVersionId: string | null;
  readonly versionDigest: CanonicalContentDigest;
}

export interface ExecutionRuleInstance {
  readonly schemaVersion: typeof EXECUTION_RULE_RECORDS_SCHEMA_VERSION;
  readonly ruleInstanceId: string;
  readonly owner: ExecutionRuleOwnerScope;
  readonly status: "active" | "paused" | "retired";
  readonly currentRuleVersionId: string;
  readonly currentLifecycleEventId: string;
  readonly createdAt: CanonicalUtcTimestamp;
  readonly updatedAt: CanonicalUtcTimestamp;
}

export type ExecutionRuleLifecycleStatus =
  ExecutionRuleInstance["status"];

export type ExecutionRuleLifecycleEventType =
  | "activated"
  | "paused"
  | "resumed"
  | "retired";

export interface ExecutionRuleLifecycleEvent {
  readonly schemaVersion: typeof EXECUTION_RULE_RECORDS_SCHEMA_VERSION;
  readonly lifecycleEventId: string;
  readonly ruleInstanceId: string;
  readonly owner: ExecutionRuleOwnerScope;
  readonly sequenceOrdinal: string;
  readonly eventType: ExecutionRuleLifecycleEventType;
  readonly previousStatus: ExecutionRuleLifecycleStatus | null;
  readonly newStatus: ExecutionRuleLifecycleStatus;
  readonly effectiveAt: CanonicalUtcTimestamp;
  readonly previousLifecycleEventId: string | null;
  readonly lifecycleEventDigest: CanonicalContentDigest;
}

export interface ExecutionRuleRecordSnapshot {
  readonly instance: ExecutionRuleInstance;
  readonly currentVersion: ExecutionRuleVersion;
}

export interface CreateExecutionRuleInput {
  readonly ruleInstanceId: string;
  readonly ruleVersionId: string;
  readonly owner: ExecutionRuleOwnerScope;
  readonly templateId: string;
  readonly configuration: unknown;
  readonly effectiveFrom: string;
}

export interface ReviseExecutionRuleInput {
  readonly ruleInstanceId: string;
  readonly ruleVersionId: string;
  readonly owner: ExecutionRuleOwnerScope;
  readonly expectedCurrentRuleVersionId: string;
  readonly configuration: unknown;
  readonly effectiveFrom: string;
}

export interface TransitionExecutionRuleLifecycleInput {
  readonly lifecycleEventId: string;
  readonly ruleInstanceId: string;
  readonly owner: ExecutionRuleOwnerScope;
  readonly expectedCurrentStatus: ExecutionRuleLifecycleStatus;
  readonly newStatus: ExecutionRuleLifecycleStatus;
  readonly effectiveAt: string;
}

export function verifyExecutionRuleOwnerScope(
  input: unknown,
  path = "$.owner",
): ExactResult<ExecutionRuleOwnerScope, AnalyticalContractFailure> {
  const record = validateContractRecord(
    input,
    ["userId", "workspaceId", "tradingAccountId"],
    [],
    path,
  );
  if (!record.ok) return record;
  const userId = validateContractKey(record.value.userId, `${path}.userId`);
  if (!userId.ok) return userId;
  const workspaceId = validateContractKey(
    record.value.workspaceId,
    `${path}.workspaceId`,
  );
  if (!workspaceId.ok) return workspaceId;
  const tradingAccountId =
    record.value.tradingAccountId === null
      ? { ok: true as const, value: null }
      : validateContractKey(
          record.value.tradingAccountId,
          `${path}.tradingAccountId`,
        );
  if (!tradingAccountId.ok) return tradingAccountId;
  return {
    ok: true,
    value: Object.freeze({
      userId: userId.value,
      workspaceId: workspaceId.value,
      tradingAccountId: tradingAccountId.value,
    }),
  };
}

function validatePositiveInteger(
  input: unknown,
  maximum: string | null,
  path: string,
): ExactResult<string, AnalyticalContractFailure> {
  if (
    typeof input !== "string" ||
    !/^[1-9][0-9]*$/.test(input) ||
    (maximum !== null && BigInt(input) > BigInt(maximum))
  ) {
    return contractFailure("ti_v3_analytics_contract_invalid", path);
  }
  return { ok: true, value: input };
}

function validatePositiveDecimal(
  input: unknown,
  maximum: string | null,
  path: string,
): ExactResult<string, AnalyticalContractFailure> {
  const parsed = validateExactDecimal(input, {
    maximumSignificantDigits: 48,
    maximumScale: 24,
    allowNegative: false,
    allowZero: false,
  });
  if (!parsed.ok || parsed.value !== input) {
    return contractFailure("ti_v3_analytics_contract_invalid", path);
  }
  if (maximum !== null) {
    const parsedMaximum = validateExactDecimal(maximum);
    if (
      !parsedMaximum.ok ||
      compareExactDecimals(parsed.value, parsedMaximum.value) > 0
    ) {
      return contractFailure("ti_v3_analytics_contract_invalid", path);
    }
  }
  return { ok: true, value: parsed.value };
}

function validateWallClockTime(
  input: unknown,
  path: string,
): ExactResult<string, AnalyticalContractFailure> {
  if (
    typeof input !== "string" ||
    !/^(?:[01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/.test(input)
  ) {
    return contractFailure("ti_v3_analytics_contract_invalid", path);
  }
  return { ok: true, value: input };
}

export function validateExecutionRuleConfiguration(
  template: ExecutionRuleTemplate,
  input: unknown,
  path = "$.configuration",
): ExactResult<Readonly<Record<string, string>>, AnalyticalContractFailure> {
  const parameterKeys = template.parameters.map((parameter) => parameter.key);
  const record = validateContractRecord(input, parameterKeys, [], path);
  if (!record.ok) return record;
  const configuration: Record<string, string> = {};

  for (const parameter of template.parameters) {
    const valuePath = `${path}.${parameter.key}`;
    const value = (() => {
      switch (parameter.kind) {
        case "positive_integer":
          return validatePositiveInteger(
            record.value[parameter.key],
            parameter.maximum,
            valuePath,
          );
        case "positive_decimal":
          return validatePositiveDecimal(
            record.value[parameter.key],
            parameter.maximum,
            valuePath,
          );
        case "wall_clock_time":
          return validateWallClockTime(record.value[parameter.key], valuePath);
        case "enum": {
          const candidate = record.value[parameter.key];
          return typeof candidate === "string" &&
              parameter.options.includes(candidate)
            ? { ok: true as const, value: candidate }
            : contractFailure("ti_v3_analytics_contract_invalid", valuePath);
        }
      }
    })();
    if (!value.ok) return value;
    configuration[parameter.key] = value.value;
  }

  if (template.templateId === "exclude_entry_price_range") {
    const lower = configuration.lowerEntryPrice as CanonicalDecimal;
    const upper = configuration.upperEntryPrice as CanonicalDecimal;
    if (compareExactDecimals(lower, upper) > 0) {
      return contractFailure(
        "ti_v3_analytics_contract_invalid",
        `${path}.upperEntryPrice`,
      );
    }
  }

  return { ok: true, value: Object.freeze({ ...configuration }) };
}

function buildExecutionRuleVersion(input: Readonly<{
  readonly ruleVersionId: unknown;
  readonly ruleInstanceId: unknown;
  readonly owner: unknown;
  readonly versionOrdinal: unknown;
  readonly templateId: unknown;
  readonly configuration: unknown;
  readonly effectiveFrom: unknown;
  readonly supersedesRuleVersionId: unknown;
}>): ExactResult<ExecutionRuleVersion, AnalyticalContractFailure> {
  const ruleVersionId = validateContractKey(
    input.ruleVersionId,
    "$.ruleVersionId",
  );
  if (!ruleVersionId.ok) return ruleVersionId;
  const ruleInstanceId = validateContractKey(
    input.ruleInstanceId,
    "$.ruleInstanceId",
  );
  if (!ruleInstanceId.ok) return ruleInstanceId;
  const owner = verifyExecutionRuleOwnerScope(input.owner);
  if (!owner.ok) return owner;
  const versionOrdinal = validatePositiveInteger(
    input.versionOrdinal,
    null,
    "$.versionOrdinal",
  );
  if (!versionOrdinal.ok) return versionOrdinal;
  if (typeof input.templateId !== "string") {
    return contractFailure(
      "ti_v3_analytics_contract_invalid",
      "$.templateId",
    );
  }
  const template = getExecutionRuleTemplate(input.templateId);
  if (template === null) {
    return contractFailure(
      "ti_v3_analytics_contract_invalid",
      "$.templateId",
    );
  }
  const configuration = validateExecutionRuleConfiguration(
    template,
    input.configuration,
  );
  if (!configuration.ok) return configuration;
  const effectiveFrom = validateTimestampValue(
    input.effectiveFrom,
    "$.effectiveFrom",
  );
  if (!effectiveFrom.ok) return effectiveFrom;
  const supersedesRuleVersionId =
    input.supersedesRuleVersionId === null
      ? { ok: true as const, value: null }
      : validateContractKey(
          input.supersedesRuleVersionId,
          "$.supersedesRuleVersionId",
        );
  if (!supersedesRuleVersionId.ok) return supersedesRuleVersionId;

  return finalizeContentAddressedAuthority(
    "execution_rule_version",
    {
      schemaVersion: EXECUTION_RULE_RECORDS_SCHEMA_VERSION,
      ruleVersionId: ruleVersionId.value,
      ruleInstanceId: ruleInstanceId.value,
      owner: owner.value,
      versionOrdinal: versionOrdinal.value,
      templateId: template.templateId,
      templateVersion: template.templateVersion,
      configuration: configuration.value,
      effectiveFrom: effectiveFrom.value,
      supersedesRuleVersionId: supersedesRuleVersionId.value,
    },
    "versionDigest",
  ) as ExactResult<ExecutionRuleVersion, AnalyticalContractFailure>;
}

export function verifyExecutionRuleVersion(
  input: unknown,
): ExactResult<ExecutionRuleVersion, AnalyticalContractFailure> {
  const record = validateContractRecord(input, [
    "schemaVersion",
    "ruleVersionId",
    "ruleInstanceId",
    "owner",
    "versionOrdinal",
    "templateId",
    "templateVersion",
    "configuration",
    "effectiveFrom",
    "supersedesRuleVersionId",
    "versionDigest",
  ]);
  if (!record.ok) return record;
  if (
    record.value.schemaVersion !== EXECUTION_RULE_RECORDS_SCHEMA_VERSION ||
    record.value.templateVersion !== "v1"
  ) {
    return contractFailure(
      "ti_v3_analytics_contract_invalid",
      "$.schemaVersion",
    );
  }
  const claimedDigest = validateClaimedDigest(
    record.value.versionDigest,
    "$.versionDigest",
    "execution_rule_version",
  );
  if (!claimedDigest.ok) return claimedDigest;
  const rebuilt = buildExecutionRuleVersion({
    ruleVersionId: record.value.ruleVersionId,
    ruleInstanceId: record.value.ruleInstanceId,
    owner: record.value.owner,
    versionOrdinal: record.value.versionOrdinal,
    templateId: record.value.templateId,
    configuration: record.value.configuration,
    effectiveFrom: record.value.effectiveFrom,
    supersedesRuleVersionId: record.value.supersedesRuleVersionId,
  });
  if (!rebuilt.ok) return rebuilt;
  if (rebuilt.value.versionDigest !== claimedDigest.value) {
    return contractFailure(
      "ti_v3_analytics_contract_digest_mismatch",
      "$.versionDigest",
    );
  }
  return rebuilt;
}

function buildExecutionRuleLifecycleEvent(input: Readonly<{
  readonly lifecycleEventId: unknown;
  readonly ruleInstanceId: unknown;
  readonly owner: unknown;
  readonly sequenceOrdinal: unknown;
  readonly eventType: unknown;
  readonly previousStatus: unknown;
  readonly newStatus: unknown;
  readonly effectiveAt: unknown;
  readonly previousLifecycleEventId: unknown;
}>): ExactResult<ExecutionRuleLifecycleEvent, AnalyticalContractFailure> {
  const lifecycleEventId = validateContractKey(
    input.lifecycleEventId,
    "$.lifecycleEventId",
  );
  if (!lifecycleEventId.ok) return lifecycleEventId;
  const ruleInstanceId = validateContractKey(
    input.ruleInstanceId,
    "$.ruleInstanceId",
  );
  if (!ruleInstanceId.ok) return ruleInstanceId;
  const owner = verifyExecutionRuleOwnerScope(input.owner);
  if (!owner.ok) return owner;
  const sequenceOrdinal = validatePositiveInteger(
    input.sequenceOrdinal,
    null,
    "$.sequenceOrdinal",
  );
  if (!sequenceOrdinal.ok) return sequenceOrdinal;
  const eventTypes = new Set<ExecutionRuleLifecycleEventType>([
    "activated",
    "paused",
    "resumed",
    "retired",
  ]);
  const statuses = new Set<ExecutionRuleLifecycleStatus>([
    "active",
    "paused",
    "retired",
  ]);
  if (
    typeof input.eventType !== "string" ||
    !eventTypes.has(input.eventType as ExecutionRuleLifecycleEventType)
  ) {
    return contractFailure(
      "ti_v3_analytics_contract_invalid",
      "$.eventType",
    );
  }
  if (
    input.previousStatus !== null &&
    (typeof input.previousStatus !== "string" ||
      !statuses.has(input.previousStatus as ExecutionRuleLifecycleStatus))
  ) {
    return contractFailure(
      "ti_v3_analytics_contract_invalid",
      "$.previousStatus",
    );
  }
  if (
    typeof input.newStatus !== "string" ||
    !statuses.has(input.newStatus as ExecutionRuleLifecycleStatus)
  ) {
    return contractFailure(
      "ti_v3_analytics_contract_invalid",
      "$.newStatus",
    );
  }
  const eventType =
    input.eventType as ExecutionRuleLifecycleEventType;
  const previousStatus =
    input.previousStatus as ExecutionRuleLifecycleStatus | null;
  const newStatus = input.newStatus as ExecutionRuleLifecycleStatus;
  const validTransition =
    (eventType === "activated" &&
      previousStatus === null &&
      newStatus === "active") ||
    (eventType === "paused" &&
      previousStatus === "active" &&
      newStatus === "paused") ||
    (eventType === "resumed" &&
      previousStatus === "paused" &&
      newStatus === "active") ||
    (eventType === "retired" &&
      (previousStatus === "active" || previousStatus === "paused") &&
      newStatus === "retired");
  if (!validTransition) {
    return contractFailure(
      "ti_v3_analytics_contract_invalid",
      "$.eventType",
    );
  }
  const effectiveAt = validateTimestampValue(
    input.effectiveAt,
    "$.effectiveAt",
  );
  if (!effectiveAt.ok) return effectiveAt;
  const previousLifecycleEventId =
    input.previousLifecycleEventId === null
      ? { ok: true as const, value: null }
      : validateContractKey(
          input.previousLifecycleEventId,
          "$.previousLifecycleEventId",
        );
  if (!previousLifecycleEventId.ok) return previousLifecycleEventId;
  if (
    (eventType === "activated") !==
    (previousLifecycleEventId.value === null)
  ) {
    return contractFailure(
      "ti_v3_analytics_contract_reference_mismatch",
      "$.previousLifecycleEventId",
    );
  }
  return finalizeContentAddressedAuthority(
    "execution_rule_lifecycle_event",
    {
      schemaVersion: EXECUTION_RULE_RECORDS_SCHEMA_VERSION,
      lifecycleEventId: lifecycleEventId.value,
      ruleInstanceId: ruleInstanceId.value,
      owner: owner.value,
      sequenceOrdinal: sequenceOrdinal.value,
      eventType,
      previousStatus,
      newStatus,
      effectiveAt: effectiveAt.value,
      previousLifecycleEventId: previousLifecycleEventId.value,
    },
    "lifecycleEventDigest",
  ) as ExactResult<ExecutionRuleLifecycleEvent, AnalyticalContractFailure>;
}

export function verifyExecutionRuleLifecycleEvent(
  input: unknown,
): ExactResult<ExecutionRuleLifecycleEvent, AnalyticalContractFailure> {
  const record = validateContractRecord(input, [
    "schemaVersion",
    "lifecycleEventId",
    "ruleInstanceId",
    "owner",
    "sequenceOrdinal",
    "eventType",
    "previousStatus",
    "newStatus",
    "effectiveAt",
    "previousLifecycleEventId",
    "lifecycleEventDigest",
  ]);
  if (!record.ok) return record;
  if (record.value.schemaVersion !== EXECUTION_RULE_RECORDS_SCHEMA_VERSION) {
    return contractFailure(
      "ti_v3_analytics_contract_invalid",
      "$.schemaVersion",
    );
  }
  const claimedDigest = validateClaimedDigest(
    record.value.lifecycleEventDigest,
    "$.lifecycleEventDigest",
    "execution_rule_lifecycle_event",
  );
  if (!claimedDigest.ok) return claimedDigest;
  const rebuilt = buildExecutionRuleLifecycleEvent({
    lifecycleEventId: record.value.lifecycleEventId,
    ruleInstanceId: record.value.ruleInstanceId,
    owner: record.value.owner,
    sequenceOrdinal: record.value.sequenceOrdinal,
    eventType: record.value.eventType,
    previousStatus: record.value.previousStatus,
    newStatus: record.value.newStatus,
    effectiveAt: record.value.effectiveAt,
    previousLifecycleEventId: record.value.previousLifecycleEventId,
  });
  if (!rebuilt.ok) return rebuilt;
  if (rebuilt.value.lifecycleEventDigest !== claimedDigest.value) {
    return contractFailure(
      "ti_v3_analytics_contract_digest_mismatch",
      "$.lifecycleEventDigest",
    );
  }
  return rebuilt;
}

function sameOwner(
  left: ExecutionRuleOwnerScope,
  right: ExecutionRuleOwnerScope,
): boolean {
  return (
    left.userId === right.userId &&
    left.workspaceId === right.workspaceId &&
    left.tradingAccountId === right.tradingAccountId
  );
}

export function verifyExecutionRuleInstance(
  input: unknown,
): ExactResult<ExecutionRuleInstance, AnalyticalContractFailure> {
  const record = validateContractRecord(input, [
    "schemaVersion",
    "ruleInstanceId",
    "owner",
    "status",
    "currentRuleVersionId",
    "currentLifecycleEventId",
    "createdAt",
    "updatedAt",
  ]);
  if (!record.ok) return record;
  if (record.value.schemaVersion !== EXECUTION_RULE_RECORDS_SCHEMA_VERSION) {
    return contractFailure(
      "ti_v3_analytics_contract_invalid",
      "$.schemaVersion",
    );
  }
  const ruleInstanceId = validateContractKey(
    record.value.ruleInstanceId,
    "$.ruleInstanceId",
  );
  if (!ruleInstanceId.ok) return ruleInstanceId;
  const owner = verifyExecutionRuleOwnerScope(record.value.owner);
  if (!owner.ok) return owner;
  if (
    record.value.status !== "active" &&
    record.value.status !== "paused" &&
    record.value.status !== "retired"
  ) {
    return contractFailure("ti_v3_analytics_contract_invalid", "$.status");
  }
  const currentRuleVersionId = validateContractKey(
    record.value.currentRuleVersionId,
    "$.currentRuleVersionId",
  );
  if (!currentRuleVersionId.ok) return currentRuleVersionId;
  const currentLifecycleEventId = validateContractKey(
    record.value.currentLifecycleEventId,
    "$.currentLifecycleEventId",
  );
  if (!currentLifecycleEventId.ok) return currentLifecycleEventId;
  const createdAt = validateTimestampValue(
    record.value.createdAt,
    "$.createdAt",
  );
  if (!createdAt.ok) return createdAt;
  const updatedAt = validateTimestampValue(
    record.value.updatedAt,
    "$.updatedAt",
  );
  if (!updatedAt.ok) return updatedAt;
  if (compareCanonicalTimestamps(createdAt.value, updatedAt.value) > 0) {
    return contractFailure("ti_v3_analytics_contract_invalid", "$.updatedAt");
  }
  return {
    ok: true,
    value: Object.freeze({
      schemaVersion: EXECUTION_RULE_RECORDS_SCHEMA_VERSION,
      ruleInstanceId: ruleInstanceId.value,
      owner: owner.value,
      status: record.value.status,
      currentRuleVersionId: currentRuleVersionId.value,
      currentLifecycleEventId: currentLifecycleEventId.value,
      createdAt: createdAt.value,
      updatedAt: updatedAt.value,
    }),
  };
}

export class InMemoryExecutionRuleRepository {
  readonly #instances = new Map<string, ExecutionRuleInstance>();
  readonly #versions = new Map<string, ExecutionRuleVersion>();
  readonly #lifecycleEvents = new Map<string, ExecutionRuleLifecycleEvent>();

  create(
    input: CreateExecutionRuleInput,
  ): ExactResult<ExecutionRuleRecordSnapshot, AnalyticalContractFailure> {
    const ruleInstanceId = validateContractKey(
      input.ruleInstanceId,
      "$.ruleInstanceId",
    );
    if (!ruleInstanceId.ok) return ruleInstanceId;
    if (this.#instances.has(ruleInstanceId.value)) {
      return contractFailure(
        "ti_v3_analytics_contract_duplicate_identity",
        "$.ruleInstanceId",
      );
    }
    if (this.#versions.has(input.ruleVersionId)) {
      return contractFailure(
        "ti_v3_analytics_contract_duplicate_identity",
        "$.ruleVersionId",
      );
    }
    const version = buildExecutionRuleVersion({
      ruleVersionId: input.ruleVersionId,
      ruleInstanceId: ruleInstanceId.value,
      owner: input.owner,
      versionOrdinal: "1",
      templateId: input.templateId,
      configuration: input.configuration,
      effectiveFrom: input.effectiveFrom,
      supersedesRuleVersionId: null,
    });
    if (!version.ok) return version;
    const initialLifecycleEventId = `rule-lifecycle:${ruleInstanceId.value}:1`;
    const instance = Object.freeze({
      schemaVersion: EXECUTION_RULE_RECORDS_SCHEMA_VERSION,
      ruleInstanceId: ruleInstanceId.value,
      owner: version.value.owner,
      status: "active" as const,
      currentRuleVersionId: version.value.ruleVersionId,
      currentLifecycleEventId: initialLifecycleEventId,
      createdAt: version.value.effectiveFrom,
      updatedAt: version.value.effectiveFrom,
    });
    const lifecycleEvent = buildExecutionRuleLifecycleEvent({
      lifecycleEventId: initialLifecycleEventId,
      ruleInstanceId: instance.ruleInstanceId,
      owner: instance.owner,
      sequenceOrdinal: "1",
      eventType: "activated",
      previousStatus: null,
      newStatus: "active",
      effectiveAt: instance.createdAt,
      previousLifecycleEventId: null,
    });
    if (!lifecycleEvent.ok) return lifecycleEvent;
    this.#versions.set(version.value.ruleVersionId, version.value);
    this.#instances.set(instance.ruleInstanceId, instance);
    this.#lifecycleEvents.set(
      lifecycleEvent.value.lifecycleEventId,
      lifecycleEvent.value,
    );
    return {
      ok: true,
      value: Object.freeze({ instance, currentVersion: version.value }),
    };
  }

  revise(
    input: ReviseExecutionRuleInput,
  ): ExactResult<ExecutionRuleRecordSnapshot, AnalyticalContractFailure> {
    const owner = verifyExecutionRuleOwnerScope(input.owner);
    if (!owner.ok) return owner;
    const ruleInstanceId = validateContractKey(
      input.ruleInstanceId,
      "$.ruleInstanceId",
    );
    if (!ruleInstanceId.ok) return ruleInstanceId;
    const existing = this.#instances.get(ruleInstanceId.value);
    if (existing === undefined || !sameOwner(existing.owner, owner.value)) {
      return contractFailure(
        "ti_v3_analytics_contract_invalid",
        "$.ruleInstanceId",
      );
    }
    if (
      existing.status !== "active" ||
      existing.currentRuleVersionId !== input.expectedCurrentRuleVersionId
    ) {
      return contractFailure(
        "ti_v3_analytics_contract_reference_mismatch",
        "$.expectedCurrentRuleVersionId",
      );
    }
    if (this.#versions.has(input.ruleVersionId)) {
      return contractFailure(
        "ti_v3_analytics_contract_duplicate_identity",
        "$.ruleVersionId",
      );
    }
    const currentVersion = this.#versions.get(existing.currentRuleVersionId);
    if (currentVersion === undefined) {
      return contractFailure(
        "ti_v3_analytics_contract_reference_mismatch",
        "$.currentRuleVersionId",
      );
    }
    const effectiveFrom = validateTimestampValue(
      input.effectiveFrom,
      "$.effectiveFrom",
    );
    if (!effectiveFrom.ok) return effectiveFrom;
    if (
      compareCanonicalTimestamps(
        effectiveFrom.value,
        existing.updatedAt,
      ) <= 0
    ) {
      return contractFailure(
        "ti_v3_analytics_contract_invalid",
        "$.effectiveFrom",
      );
    }
    const version = buildExecutionRuleVersion({
      ruleVersionId: input.ruleVersionId,
      ruleInstanceId: existing.ruleInstanceId,
      owner: existing.owner,
      versionOrdinal: String(
        this.listVersions(existing.owner, existing.ruleInstanceId).length + 1,
      ),
      templateId: currentVersion.templateId,
      configuration: input.configuration,
      effectiveFrom: effectiveFrom.value,
      supersedesRuleVersionId: currentVersion.ruleVersionId,
    });
    if (!version.ok) return version;
    const instance = Object.freeze({
      ...existing,
      currentRuleVersionId: version.value.ruleVersionId,
      updatedAt: version.value.effectiveFrom,
    });
    this.#versions.set(version.value.ruleVersionId, version.value);
    this.#instances.set(instance.ruleInstanceId, instance);
    return {
      ok: true,
      value: Object.freeze({ instance, currentVersion: version.value }),
    };
  }

  transitionLifecycle(
    input: TransitionExecutionRuleLifecycleInput,
  ): ExactResult<ExecutionRuleRecordSnapshot, AnalyticalContractFailure> {
    const owner = verifyExecutionRuleOwnerScope(input.owner);
    if (!owner.ok) return owner;
    const ruleInstanceId = validateContractKey(
      input.ruleInstanceId,
      "$.ruleInstanceId",
    );
    if (!ruleInstanceId.ok) return ruleInstanceId;
    const lifecycleEventId = validateContractKey(
      input.lifecycleEventId,
      "$.lifecycleEventId",
    );
    if (!lifecycleEventId.ok) return lifecycleEventId;
    if (this.#lifecycleEvents.has(lifecycleEventId.value)) {
      return contractFailure(
        "ti_v3_analytics_contract_duplicate_identity",
        "$.lifecycleEventId",
      );
    }
    const existing = this.#instances.get(ruleInstanceId.value);
    if (existing === undefined || !sameOwner(existing.owner, owner.value)) {
      return contractFailure(
        "ti_v3_analytics_contract_invalid",
        "$.ruleInstanceId",
      );
    }
    if (existing.status !== input.expectedCurrentStatus) {
      return contractFailure(
        "ti_v3_analytics_contract_reference_mismatch",
        "$.expectedCurrentStatus",
      );
    }
    const eventType = (() => {
      if (existing.status === "active" && input.newStatus === "paused") {
        return "paused" as const;
      }
      if (existing.status === "paused" && input.newStatus === "active") {
        return "resumed" as const;
      }
      if (
        (existing.status === "active" || existing.status === "paused") &&
        input.newStatus === "retired"
      ) {
        return "retired" as const;
      }
      return null;
    })();
    if (eventType === null) {
      return contractFailure(
        "ti_v3_analytics_contract_invalid",
        "$.newStatus",
      );
    }
    const effectiveAt = validateTimestampValue(
      input.effectiveAt,
      "$.effectiveAt",
    );
    if (!effectiveAt.ok) return effectiveAt;
    if (
      compareCanonicalTimestamps(effectiveAt.value, existing.updatedAt) <= 0
    ) {
      return contractFailure(
        "ti_v3_analytics_contract_invalid",
        "$.effectiveAt",
      );
    }
    const lifecycleHistory = this.listLifecycleEvents(
      existing.owner,
      existing.ruleInstanceId,
    );
    const previousEvent = lifecycleHistory.at(-1);
    if (previousEvent === undefined) {
      return contractFailure(
        "ti_v3_analytics_contract_reference_mismatch",
        "$.previousLifecycleEventId",
      );
    }
    const lifecycleEvent = buildExecutionRuleLifecycleEvent({
      lifecycleEventId: lifecycleEventId.value,
      ruleInstanceId: existing.ruleInstanceId,
      owner: existing.owner,
      sequenceOrdinal: String(lifecycleHistory.length + 1),
      eventType,
      previousStatus: existing.status,
      newStatus: input.newStatus,
      effectiveAt: effectiveAt.value,
      previousLifecycleEventId: previousEvent.lifecycleEventId,
    });
    if (!lifecycleEvent.ok) return lifecycleEvent;
    const currentVersion = this.#versions.get(existing.currentRuleVersionId);
    if (currentVersion === undefined) {
      return contractFailure(
        "ti_v3_analytics_contract_reference_mismatch",
        "$.currentRuleVersionId",
      );
    }
    const instance = Object.freeze({
      ...existing,
      status: input.newStatus,
      currentLifecycleEventId: lifecycleEvent.value.lifecycleEventId,
      updatedAt: lifecycleEvent.value.effectiveAt,
    });
    this.#lifecycleEvents.set(
      lifecycleEvent.value.lifecycleEventId,
      lifecycleEvent.value,
    );
    this.#instances.set(instance.ruleInstanceId, instance);
    return {
      ok: true,
      value: Object.freeze({ instance, currentVersion }),
    };
  }

  get(
    owner: ExecutionRuleOwnerScope,
    ruleInstanceId: string,
  ): ExecutionRuleRecordSnapshot | null {
    const instance = this.#instances.get(ruleInstanceId);
    if (instance === undefined || !sameOwner(instance.owner, owner)) return null;
    const currentVersion = this.#versions.get(instance.currentRuleVersionId);
    return currentVersion === undefined
      ? null
      : Object.freeze({ instance, currentVersion });
  }

  list(owner: ExecutionRuleOwnerScope): readonly ExecutionRuleRecordSnapshot[] {
    return Object.freeze(
      [...this.#instances.values()]
        .filter((instance) => sameOwner(instance.owner, owner))
        .sort((left, right) =>
          left.ruleInstanceId < right.ruleInstanceId
            ? -1
            : left.ruleInstanceId > right.ruleInstanceId
              ? 1
              : 0,
        )
        .flatMap((instance) => {
          const currentVersion = this.#versions.get(
            instance.currentRuleVersionId,
          );
          return currentVersion === undefined
            ? []
            : [Object.freeze({ instance, currentVersion })];
        }),
    );
  }

  listVersions(
    owner: ExecutionRuleOwnerScope,
    ruleInstanceId: string,
  ): readonly ExecutionRuleVersion[] {
    return Object.freeze(
      [...this.#versions.values()]
        .filter(
          (version) =>
            version.ruleInstanceId === ruleInstanceId &&
            sameOwner(version.owner, owner),
        )
        .sort(
          (left, right) =>
            Number(left.versionOrdinal) - Number(right.versionOrdinal),
      ),
    );
  }

  listLifecycleEvents(
    owner: ExecutionRuleOwnerScope,
    ruleInstanceId: string,
  ): readonly ExecutionRuleLifecycleEvent[] {
    return Object.freeze(
      [...this.#lifecycleEvents.values()]
        .filter(
          (event) =>
            event.ruleInstanceId === ruleInstanceId &&
            sameOwner(event.owner, owner),
        )
        .sort((left, right) => {
          const leftOrdinal = BigInt(left.sequenceOrdinal);
          const rightOrdinal = BigInt(right.sequenceOrdinal);
          return leftOrdinal < rightOrdinal
            ? -1
            : leftOrdinal > rightOrdinal
              ? 1
              : 0;
        }),
    );
  }
}
