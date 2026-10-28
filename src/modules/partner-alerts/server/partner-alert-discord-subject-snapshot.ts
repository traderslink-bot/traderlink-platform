import { partnerAlertExactKeys, partnerAlertId, partnerAlertInteger, partnerAlertRecord,
  partnerAlertSnowflake, partnerAlertUtc } from "../contracts/partner-alert-validation";

/** Own observation shape, NOT an existing Platform export or verified receipt.
 * A future reviewed server adapter must establish provenance and completeness. */
export type PartnerAlertDiscordSubjectObservation = Readonly<{
  userId: string;
  generation: number;
  observedAtUtc: string;
  identities: readonly Readonly<{ userId: string; discordUserId: string; status: "active" | "revoked";
    linkedAtUtc: string; changedAtUtc: string }>[];
}>;
export type PartnerAlertDiscordMemberObservation = Readonly<{
  requestedGuildId: string;
  requestedDiscordUserId: string;
  identityGeneration: number;
  observedAtUtc: string;
  /** Full native member object; user.id must bind the response to the subject. */
  member: unknown;
}>;
export type PartnerAlertDiscordSubjectCandidateInput = Readonly<{
  userId: string;
  destinationGuildId: string;
  minimumGeneration: number;
  maximumObservationAgeMs: number;
  nowUtc: string;
  subjects: PartnerAlertDiscordSubjectObservation;
  membership: PartnerAlertDiscordMemberObservation;
}>;
const QUALIFICATION = Object.freeze([
  "authenticated_complete_current_identity_source",
  "monotonic_generation_and_retained_previous_subject_history",
  "native_read_bound_to_requested_subject_and_guild",
  "reviewed_premium_policy_and_current_runtime_binding",
] as const);
type CandidateReason = "invalid_observation" | "subject_scope_mismatch" | "current_subject_missing"
  | "current_subject_ambiguous" | "generation_mismatch" | "stale_observation" | "member_scope_mismatch"
  | "member_read_predates_link" | "member_not_eligible";
export type PartnerAlertDiscordSubjectCandidate = Readonly<{
  kind: "consistency_candidate";
  canAuthorise: false;
  provenance: "unqualified_observations";
  requiresRuntimeQualification: typeof QUALIFICATION;
  userId: string;
  discordUserId: string;
  guildId: string;
  generation: number;
  observedRoleIds: readonly string[];
  observedAtUtc: string;
  candidateExpiresAtUtc: string;
}>;
export type PartnerAlertDiscordSubjectCandidateResult = PartnerAlertDiscordSubjectCandidate | Readonly<{
  kind: "no_candidate";
  canAuthorise: false;
  reason: CandidateReason;
  requiresRuntimeQualification: typeof QUALIFICATION;
}>;
function rejected(reason: CandidateReason): PartnerAlertDiscordSubjectCandidateResult {
  return Object.freeze({ kind: "no_candidate", canAuthorise: false, reason, requiresRuntimeQualification: QUALIFICATION });
}

/** Pure consistency check. Does not authenticate an observation, mint access
 * evidence, evaluate Premium, select a previous identity, or assign a role.
 * Even a valid candidate always has canAuthorise:false. No I/O/startup/config. */
export function normalizePartnerAlertDiscordSubjectSnapshot(raw: unknown): PartnerAlertDiscordSubjectCandidateResult {
  try {
    const input = partnerAlertRecord(raw, "subjectSnapshot");
    partnerAlertExactKeys(input, ["userId", "destinationGuildId", "minimumGeneration", "maximumObservationAgeMs",
      "nowUtc", "subjects", "membership"], "subjectSnapshot");
    const userId = partnerAlertId(input.userId, "userId");
    const guildId = partnerAlertSnowflake(input.destinationGuildId, "destinationGuildId");
    const minimum = partnerAlertInteger(input.minimumGeneration, "minimumGeneration", 1);
    const maximumAge = partnerAlertInteger(input.maximumObservationAgeMs, "maximumObservationAgeMs", 1, 300_000);
    const now = partnerAlertUtc(input.nowUtc, "nowUtc");
    const subjects = partnerAlertRecord(input.subjects, "subjects");
    partnerAlertExactKeys(subjects, ["userId", "generation", "observedAtUtc", "identities"], "subjects");
    if (subjects.userId !== userId) return rejected("subject_scope_mismatch");
    const generation = partnerAlertInteger(subjects.generation, "generation", 1);
    if (generation < minimum) return rejected("generation_mismatch");
    const identityObserved = partnerAlertUtc(subjects.observedAtUtc, "identityObservedAtUtc");
    if (identityObserved > now || Date.parse(now) - Date.parse(identityObserved) >= maximumAge) return rejected("stale_observation");
    if (!Array.isArray(subjects.identities) || subjects.identities.length > 100) return rejected("invalid_observation");
    const seen = new Set<string>();
    const active: { discordUserId: string; changedAtUtc: string }[] = [];
    for (const value of subjects.identities) {
      const row = partnerAlertRecord(value, "identity");
      partnerAlertExactKeys(row, ["userId", "discordUserId", "status", "linkedAtUtc", "changedAtUtc"], "identity");
      if (row.userId !== userId) return rejected("subject_scope_mismatch");
      const id = partnerAlertSnowflake(row.discordUserId, "discordUserId");
      if (seen.has(id)) return rejected("current_subject_ambiguous");
      seen.add(id);
      if (row.status !== "active" && row.status !== "revoked") return rejected("invalid_observation");
      const linked = partnerAlertUtc(row.linkedAtUtc, "linkedAtUtc");
      const changed = partnerAlertUtc(row.changedAtUtc, "changedAtUtc");
      if (changed < linked || changed > identityObserved) return rejected("invalid_observation");
      if (row.status === "active") active.push({ discordUserId: id, changedAtUtc: changed });
    }
    if (!active.length) return rejected("current_subject_missing");
    if (active.length !== 1) return rejected("current_subject_ambiguous");
    const subject = active[0]!;
    const read = partnerAlertRecord(input.membership, "membership");
    partnerAlertExactKeys(read, ["requestedGuildId", "requestedDiscordUserId", "identityGeneration", "observedAtUtc", "member"], "membership");
    if (read.requestedGuildId !== guildId || read.requestedDiscordUserId !== subject.discordUserId) return rejected("member_scope_mismatch");
    if (partnerAlertInteger(read.identityGeneration, "identityGeneration", 1) !== generation) return rejected("generation_mismatch");
    const memberObserved = partnerAlertUtc(read.observedAtUtc, "memberObservedAtUtc");
    if (memberObserved > now || Date.parse(now) - Date.parse(memberObserved) >= maximumAge) return rejected("stale_observation");
    if (memberObserved < subject.changedAtUtc || memberObserved < identityObserved) return rejected("member_read_predates_link");
    const member = partnerAlertRecord(read.member, "member");
    const user = partnerAlertRecord(member.user, "discordUser");
    if (user.id !== subject.discordUserId || (member.guild_id !== undefined && member.guild_id !== guildId)) return rejected("member_scope_mismatch");
    if ((user.bot !== undefined && typeof user.bot !== "boolean")
      || (user.system !== undefined && typeof user.system !== "boolean")
      || (member.pending !== undefined && typeof member.pending !== "boolean")) return rejected("invalid_observation");
    if (user.bot === true || user.system === true || member.pending === true) return rejected("member_not_eligible");
    if (!Array.isArray(member.roles) || member.roles.length > 250) return rejected("invalid_observation");
    const roles = member.roles.map(role => partnerAlertSnowflake(role, "roleId"));
    if (new Set(roles).size !== roles.length) return rejected("invalid_observation");
    const expires = Math.min(Date.parse(identityObserved), Date.parse(memberObserved)) + maximumAge;
    const until = partnerAlertUtc(new Date(expires).toISOString(), "candidateExpiresAtUtc");
    return Object.freeze({ kind: "consistency_candidate", canAuthorise: false, provenance: "unqualified_observations",
      requiresRuntimeQualification: QUALIFICATION, userId, discordUserId: subject.discordUserId, guildId, generation,
      observedRoleIds: Object.freeze(roles.sort()), observedAtUtc: memberObserved, candidateExpiresAtUtc: until });
  } catch { return rejected("invalid_observation"); }
}
