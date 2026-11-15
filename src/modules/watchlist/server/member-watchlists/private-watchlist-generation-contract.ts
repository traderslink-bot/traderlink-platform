export type PrivateGenerationSelection = Readonly<{ analysis: boolean; indicators: boolean; levels: boolean }>;
export type PrivateGenerationInput = Readonly<{ userId: string; requestId: string; symbol: string; selection: PrivateGenerationSelection }>;
export type PrivateGenerationRequest = PrivateGenerationInput & Readonly<{ requestHash: string; maximumCostMicrousd: number }>;

export interface PrivateWatchlistGenerationProvider {
  /** Non-billable bound for all attempts and tools; never generates. */
  quote(input: PrivateGenerationInput): Promise<number>;
  generate(input: PrivateGenerationRequest): Promise<unknown>;
  /** Read-only receipt lookup. Absence never permits automatic paid retry. */
  receipt(input: PrivateGenerationRequest): Promise<unknown>;
}
