import type { ScanDefinition } from "./definition";

export const SHARED_SCAN_PATH = "/api/scanners/shared";
export const SHARED_SCAN_ID = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/u;
export type ScanSharingMode = "results" | "filters";

export type ScanShare = { id: string; mode: ScanSharingMode };
export type SharedScanView = ScanShare & { name: string; definition?: ScanDefinition };
export const sharedScanLink = (id: string) => "/scanners/shared/" + encodeURIComponent(id);
