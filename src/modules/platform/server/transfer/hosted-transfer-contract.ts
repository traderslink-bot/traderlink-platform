import { createHash } from "node:crypto";

import {
  isLowercaseSha256,
  platformFailure,
} from "../database/platform-migration-contract";

export const HOSTED_TRANSFER_MODULES = Object.freeze([
  "academy",
  "watchlist",
  "news",
  "affiliate",
] as const);

export type HostedTransferModule = (typeof HOSTED_TRANSFER_MODULES)[number];

export type HostedTransferModuleCounts = Readonly<{
  source: number;
  accepted: number;
  unchanged: number;
  pending: number;
  conflicts: number;
}>;

export type HostedTransferModulePreview = Readonly<{
  module: HostedTransferModule;
  sourceSnapshotSha256: string;
  previewSha256: string;
  counts: HostedTransferModuleCounts;
}>;

export type HostedTransferPreview = Readonly<{
  contractVersion: "traderlink_hosted_transfer_v1";
  previewSha256: string;
  modules: readonly HostedTransferModulePreview[];
}>;

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortValue);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right, "en"))
      .map(([key, nested]) => [key, sortValue(nested)]),
  );
}

export function canonicalHostedTransferJson(value: unknown): string {
  return `${JSON.stringify(sortValue(value))}\n`;
}

export function hostedTransferSha256(value: unknown): string {
  return createHash("sha256")
    .update(canonicalHostedTransferJson(value), "utf8")
    .digest("hex");
}

export function assertHostedTransferDigest(value: string, field: string): void {
  if (!isLowercaseSha256(value)) {
    platformFailure("TRADERLINK_HOSTED_TRANSFER_INVALID", { field });
  }
}

export function buildHostedTransferPreview(
  modules: readonly HostedTransferModulePreview[],
): HostedTransferPreview {
  const ordered = [...modules].sort((left, right) =>
    left.module.localeCompare(right.module, "en"),
  );
  const expected = [...HOSTED_TRANSFER_MODULES].sort((left, right) =>
    left.localeCompare(right, "en"),
  );
  if (
    ordered.length !== expected.length ||
    ordered.some((modulePreview, index) => modulePreview.module !== expected[index])
  ) {
    platformFailure("TRADERLINK_HOSTED_TRANSFER_INVALID", {
      field: "moduleCardinality",
    });
  }
  for (const modulePreview of ordered) {
    assertHostedTransferDigest(modulePreview.sourceSnapshotSha256, "sourceSnapshotSha256");
    assertHostedTransferDigest(modulePreview.previewSha256, "modulePreviewSha256");
    for (const [field, count] of Object.entries(modulePreview.counts)) {
      if (!Number.isSafeInteger(count) || count < 0) {
        platformFailure("TRADERLINK_HOSTED_TRANSFER_INVALID", { field });
      }
    }
  }
  const contract = Object.freeze({
    contractVersion: "traderlink_hosted_transfer_v1" as const,
    modules: Object.freeze(ordered),
  });
  return Object.freeze({
    ...contract,
    previewSha256: hostedTransferSha256(contract),
  });
}
