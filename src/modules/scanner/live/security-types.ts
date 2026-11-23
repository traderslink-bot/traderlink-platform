export const SCANNER_SECURITY_TYPES = {
  COMMON: "Common stock",
  ORDINARY: "Ordinary shares",
  DEPOSITARY: "American depositary shares or receipts",
  PREFERRED: "Preferred shares",
  WARRANT: "Warrants",
  RIGHT: "Rights",
  UNIT: "Units",
  ETF: "ETF",
} as const;

export type ScannerSecurityType = keyof typeof SCANNER_SECURITY_TYPES;

export function scannerSecurityType(value: unknown): ScannerSecurityType | undefined {
  if (typeof value === "string" && Object.hasOwn(SCANNER_SECURITY_TYPES, value)) return value as ScannerSecurityType;
}
