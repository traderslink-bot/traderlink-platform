import type { PlatformPremiumAuthorityPolicyInput } from
  "../../platform/server/membership/platform-premium-authority-repository";

const MAX_BODY_BYTES = 512;
const REF = /^[A-Za-z0-9_:-]{1,160}$/u;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;
const SHA256 = /^[0-9a-f]{64}$/u;
const SNOWFLAKE = /^[1-9][0-9]{0,19}$/u;

export type PaidPartnerInitializerConfiguration = Readonly<{
  expectedSchemaSha256: string;
  profileCatalogSha256: string;
  profile: Readonly<{ profileRef: string; retentionPolicyRef: string; backupPolicyRef: string; validUntilUtc: string }>;
  policy: PlatformPremiumAuthorityPolicyInput;
  maximumCommandMs: number;
}>;
export type PaidPartnerInitializerCommand = Readonly<{ kind: "configure_global";
  expectedProfileGeneration: number | null; expectedPolicyGeneration: number | null }>
  | Readonly<{ kind: "admit_subject"; mode: "onboard" | "readmit" }>;
export type PaidPartnerPreparedInitializer = Readonly<{
  configuration: PaidPartnerInitializerConfiguration;
  command: PaidPartnerInitializerCommand;
  evidence: Readonly<{ startedEpochMs: number; highestObservedEpochMs: number; deadlineEpochMs: number;
    method: "POST"; headersBinding: string; signal: AbortSignal }>;
}>;

function fail(): never { throw new Error("partner_initializer_invalid"); }
const reference = (value: unknown): string => typeof value === "string" && REF.test(value) ? value : fail();
const finiteClock = (value: number, floor: number): number => Number.isSafeInteger(value) && value >= 0 && value >= floor ? value : fail();
const exactKeys = (value: Record<string, unknown>, keys: readonly string[]): boolean =>
  JSON.stringify(Object.keys(value).sort()) === JSON.stringify([...keys].sort());

function captureConfiguration(raw: PaidPartnerInitializerConfiguration, nowUtc: string): PaidPartnerInitializerConfiguration {
  const copy = structuredClone(raw) as PaidPartnerInitializerConfiguration;
  if (!SHA256.test(copy.expectedSchemaSha256) || !SHA256.test(copy.profileCatalogSha256)
    || !Number.isSafeInteger(copy.maximumCommandMs) || copy.maximumCommandMs < 1 || copy.maximumCommandMs > 30_000
    || !REF.test(copy.profile.profileRef) || !REF.test(copy.profile.retentionPolicyRef)
    || !REF.test(copy.profile.backupPolicyRef) || new Date(copy.profile.validUntilUtc).toISOString() !== copy.profile.validUntilUtc
    || copy.profile.validUntilUtc <= nowUtc || copy.policy.state !== "active"
    || !REF.test(copy.policy.policyRef) || !REF.test(copy.policy.configurationRef)
    || !SNOWFLAKE.test(copy.policy.guildId) || BigInt(copy.policy.guildId) >= (BigInt(1) << BigInt(64))
    || !Number.isSafeInteger(copy.policy.maximumEvidenceAgeMs) || copy.policy.maximumEvidenceAgeMs < 1
    || copy.policy.maximumEvidenceAgeMs > 300_000 || !Array.isArray(copy.policy.offerScopes)
    || copy.policy.offerScopes.length < 1 || copy.policy.offerScopes.length > 250
    || !Array.isArray(copy.policy.premiumPlanIds) || copy.policy.premiumPlanIds.length < 1
    || copy.policy.premiumPlanIds.length > 250 || new Set(copy.policy.premiumPlanIds).size !== copy.policy.premiumPlanIds.length
    || copy.policy.premiumPlanIds.some(id => !UUID.test(id)) || !copy.policy.nativeQualification
    || !REF.test(copy.policy.nativeQualification.reviewRef) || !SHA256.test(copy.policy.nativeQualification.schemaSha256)
    || !REF.test(copy.policy.nativeQualification.apiVersion)) fail();
  const scopes = new Set<string>();
  const offerScopes = copy.policy.offerScopes.map(scope => {
    if (!REF.test(scope.scopeRef) || scopes.has(scope.scopeRef) || !["sandbox", "live"].includes(scope.environment)
      || !REF.test(scope.accountId) || !REF.test(scope.productId) || !REF.test(scope.planId)) fail();
    scopes.add(scope.scopeRef); return Object.freeze({ ...scope });
  });
  return Object.freeze({ expectedSchemaSha256: copy.expectedSchemaSha256,
    profileCatalogSha256: copy.profileCatalogSha256, maximumCommandMs: copy.maximumCommandMs,
    profile: Object.freeze({ ...copy.profile }), policy: Object.freeze({ ...copy.policy,
      offerScopes: Object.freeze(offerScopes), premiumPlanIds: Object.freeze([...copy.policy.premiumPlanIds]),
      nativeQualification: Object.freeze({ ...copy.policy.nativeQualification }) }) });
}

export function parsePaidPartnerInitializerCommand(value: Record<string, unknown>): PaidPartnerInitializerCommand {
  if (value.kind === "configure_global") {
    if (!exactKeys(value, ["kind", "expectedProfileGeneration", "expectedPolicyGeneration"])) fail();
    const profile = value.expectedProfileGeneration, policy = value.expectedPolicyGeneration;
    const generation = (item: unknown) => item === null || (Number.isSafeInteger(item) && Number(item) >= 1);
    if (!generation(profile) || !generation(policy) || ((profile === null) !== (policy === null))) fail();
    return Object.freeze({ kind: "configure_global", expectedProfileGeneration: profile as number | null,
      expectedPolicyGeneration: policy as number | null });
  }
  if (value.kind === "admit_subject" && exactKeys(value, ["kind", "mode"])
    && ["onboard", "readmit"].includes(String(value.mode))) {
    return Object.freeze({ kind: "admit_subject", mode: value.mode as "onboard" | "readmit" });
  }
  return fail();
}

async function readBody(request: Request, started: number, deadline: number, clock: () => number): Promise<{
  value: Record<string, unknown>; highest: number }> {
  const length = request.headers.get("content-length");
  if (!/^application\/json(?:\s*;\s*charset=utf-8)?$/iu.test(request.headers.get("content-type") ?? "")
    || (request.headers.get("content-encoding") ?? "identity") !== "identity"
    || (length !== null && (!/^[0-9]{1,6}$/u.test(length) || Number(length) > MAX_BODY_BYTES)) || !request.body) fail();
  const reader = request.body.getReader(); const chunks: Uint8Array[] = []; let bytes = 0, highest = started;
  let pending: Promise<ReadableStreamReadResult<Uint8Array>> | null = null, released = false;
  const release = () => { if (!released) try { reader.releaseLock(); released = true; } catch { /* pending read */ } };
  const dispose = () => { try { void reader.cancel().catch(() => undefined); } catch { /* bounded failure */ }
    if (pending) void pending.then(release, release); else release(); };
  try {
    for (;;) {
      if (request.signal.aborted) fail();
      highest = finiteClock(clock(), highest); const remaining = deadline - highest; if (remaining <= 0) fail();
      let timer: ReturnType<typeof setTimeout> | undefined; let abort: (() => void) | undefined;
      pending = reader.read(); void pending.catch(() => undefined);
      try {
        const item = await Promise.race([pending,
          new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error("timeout")), remaining); }),
          new Promise<never>((_, reject) => { abort = () => reject(new Error("abort"));
            request.signal.addEventListener("abort", abort, { once: true }); })]);
        pending = null; if (item.done) break; bytes += item.value.byteLength; if (bytes > MAX_BODY_BYTES) fail();
        chunks.push(item.value.slice());
      } finally { if (timer !== undefined) clearTimeout(timer); if (abort) request.signal.removeEventListener("abort", abort); }
    }
  } catch (error) { dispose(); throw error; }
  release(); highest = finiteClock(clock(), highest); if (highest >= deadline || request.signal.aborted) fail();
  const body = new Uint8Array(bytes); let offset = 0; for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.length; }
  let value: unknown; try { value = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(body)); } catch { return fail(); }
  if (!value || typeof value !== "object" || Array.isArray(value)) fail();
  return { value: value as Record<string, unknown>, highest };
}

export async function preparePaidPartnerInitializer(input: Readonly<{ request: Request;
  configuration: PaidPartnerInitializerConfiguration; now: () => Date }>): Promise<PaidPartnerPreparedInitializer> {
  const started = finiteClock(input.now().getTime(), 0); const nowUtc = new Date(started).toISOString();
  const configuration = captureConfiguration(input.configuration, nowUtc);
  if (input.request.method !== "POST" || input.request.signal.aborted
    || !Number.isSafeInteger(started + configuration.maximumCommandMs)) fail();
  const headersBinding = JSON.stringify([...input.request.headers.entries()]);
  const deadline = started + configuration.maximumCommandMs;
  const body = await readBody(input.request, started, deadline, () => input.now().getTime());
  if (JSON.stringify([...input.request.headers.entries()]) !== headersBinding) fail();
  return Object.freeze({ configuration, command: parsePaidPartnerInitializerCommand(body.value),
    evidence: Object.freeze({ startedEpochMs: started, highestObservedEpochMs: body.highest,
      deadlineEpochMs: deadline, method: "POST", headersBinding, signal: input.request.signal }) });
}

export function assertPaidPartnerPreparedCurrent(request: Request, prepared: PaidPartnerPreparedInitializer,
  nowEpochMs: number): void {
  const now = finiteClock(nowEpochMs, prepared.evidence.highestObservedEpochMs);
  if (now >= prepared.evidence.deadlineEpochMs || request.method !== prepared.evidence.method
    || request.signal !== prepared.evidence.signal || request.signal.aborted
    || JSON.stringify([...request.headers.entries()]) !== prepared.evidence.headersBinding) fail();
}
