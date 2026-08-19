import type { CoachAiGenerationUsage } from "./coach-ai-review-repository";

export type CoachAiReviewEvidenceAuthoringCallKind =
  | "weekly_authoring"
  | "monthly_partition_extraction"
  | "monthly_synthesis";

/**
 * The authoring modules know nothing about account or database identity. This
 * observer lets the durable issuance layer reserve and record each provider
 * call before it leaves the process, then attach the returned usage afterward.
 */
export interface CoachAiReviewEvidenceAuthoringCallObserver {
  beforeCall(input: Readonly<{
    kind: CoachAiReviewEvidenceAuthoringCallKind;
    system: string;
    prompt: string;
    maximumOutputTokens: number;
  }>): Promise<unknown> | unknown;
  completeCall(input: Readonly<{
    handle: unknown;
    usage: CoachAiGenerationUsage;
    providerResponseId: string | null;
  }>): Promise<void> | void;
  failCall(input: Readonly<{
    handle: unknown;
    failureCode: string;
  }>): Promise<void> | void;
}
