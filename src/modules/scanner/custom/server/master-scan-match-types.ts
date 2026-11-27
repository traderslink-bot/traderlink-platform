import type { ScanDefinition } from "../definition";

export type MasterScanRecipient = Readonly<{ userId: string; workspaceId: string }>;
export type MasterScanSource = Readonly<{ kind: "scan"; scanId: string; version: string }>;
export type MasterScanSelection = Readonly<{ kind: "preset" | "saved" | "shared"; id: string }>;
export type MasterScanOffer = Readonly<{ source: MasterScanSource; title: string }>;
export type MasterScanAccess = "allowed" | "access-lost" | "review-required";
export type MasterScanSession = "premarket" | "regular" | "afterhours";
export type MasterScanMatch = Readonly<{
  instrumentId: string;
  observedAtUtc: string;
  activation?: Readonly<{ startedAtUtc: string; reactivated: boolean }>;
  evidenceRef: string;
}>;
type Run = Readonly<{
  scanId: string;
  version: string;
  runId: string;
  sequence: number;
  session: MasterScanSession;
  detectedAtUtc: string;
}>;
export type MasterScanEvaluation = Run & (
  | Readonly<{ coverage: "complete" | "partial"; matches: readonly MasterScanMatch[] }>
  | Readonly<{ coverage: "unavailable" }>
);
export type ResolvedMasterScan = MasterScanOffer & (
  | { kind: "preset"; preset: string; configurationRevision: number }
  | { kind: "saved" | "shared"; definition: ScanDefinition }
);
