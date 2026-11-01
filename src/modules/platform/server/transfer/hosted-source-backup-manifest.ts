import { createHmac, timingSafeEqual } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import type { JournalPrivacyHmacConfiguration } from "@/src/modules/journal/server/imports/journal-import-service";
import { platformFailure } from "../database/platform-migration-contract";
import type { HostedSourceSnapshots } from "./hosted-source-snapshot-reader";
import { canonicalHostedTransferJson, type HostedTransferModule } from "./hosted-transfer-contract";

const VERSION = "traderlink_hosted_source_backup_manifest_v1";
const MODULES = ["academy", "watchlist", "news", "affiliate"] as const;
export type HostedSourceBackupEvidence = Readonly<{
  module: HostedTransferModule; snapshotSha256: string; backupCompletedAtUtc: string; sourceIdentity: string;
}>;

/** Called only by trusted export/backup tooling using its actual capture evidence. */
export function signHostedSourceBackupManifest(
  modules: readonly HostedSourceBackupEvidence[], configuration: JournalPrivacyHmacConfiguration,
): string {
  const payload = { contractVersion: VERSION, keyVersion: configuration.activeKeyVersion, modules };
  const encoded = configuration.keysBase64[configuration.activeKeyVersion];
  if (!encoded || Buffer.from(encoded, "base64").length < 32) invalid();
  const signatureSha256 = createHmac("sha256", Buffer.from(encoded, "base64"))
    .update(`${VERSION}\n${canonicalHostedTransferJson(payload)}`, "utf8").digest("hex");
  return JSON.stringify({ ...payload, signatureSha256 });
}

function invalid(): never { return platformFailure("TRADERLINK_HOSTED_TRANSFER_AUTHORIZATION_REQUIRED", { check: "source_backup_manifest" }); }

export function verifyHostedSourceBackupManifest(
  raw: string, sources: HostedSourceSnapshots, configuration: JournalPrivacyHmacConfiguration, now = new Date(),
): Readonly<Record<HostedTransferModule, string>> {
  if (Buffer.byteLength(raw) > 32 * 1024) invalid();
  let value: Record<string, unknown>;
  try { value = JSON.parse(raw); } catch { invalid(); }
  if (!value || Array.isArray(value) || value.contractVersion !== VERSION || typeof value.keyVersion !== "string" ||
      typeof value.signatureSha256 !== "string" || !/^[0-9a-f]{64}$/u.test(value.signatureSha256) ||
      !Array.isArray(value.modules) || value.modules.length !== MODULES.length) invalid();
  const encoded = configuration.keysBase64[value.keyVersion];
  if (!encoded || Buffer.from(encoded, "base64").length < 32) invalid();
  const payload = { contractVersion: VERSION, keyVersion: value.keyVersion, modules: value.modules };
  const signature = createHmac("sha256", Buffer.from(encoded, "base64"))
    .update(`${VERSION}\n${canonicalHostedTransferJson(payload)}`, "utf8").digest();
  if (!timingSafeEqual(signature, Buffer.from(value.signatureSha256, "hex"))) invalid();
  const result = {} as Record<HostedTransferModule, string>;
  for (const moduleName of MODULES) {
    const matches = value.modules.filter((entry) => entry && typeof entry === "object" && entry.module === moduleName);
    if (matches.length !== 1) invalid();
    const entry = matches[0] as HostedSourceBackupEvidence;
    const timestamp = Date.parse(entry.backupCompletedAtUtc);
    if (entry.snapshotSha256 !== sources[moduleName].sha256 || !Number.isFinite(timestamp) ||
        typeof entry.sourceIdentity !== "string" || entry.sourceIdentity.length < 1 || entry.sourceIdentity.length > 255 ||
        now.getTime() - timestamp < -60_000 || now.getTime() - timestamp > 24 * 60 * 60_000) invalid();
    result[moduleName] = new Date(timestamp).toISOString();
  }
  return Object.freeze(result);
}

export function readHostedSourceBackupManifest(directory: string, sources: HostedSourceSnapshots,
  configuration: JournalPrivacyHmacConfiguration): Readonly<Record<HostedTransferModule, string>> {
  try {
    const path = join(directory, "source-backup-manifest.json");
    if (!statSync(path).isFile() || statSync(path).size > 32 * 1024) invalid();
    return verifyHostedSourceBackupManifest(readFileSync(path, "utf8"), sources, configuration);
  } catch { return invalid(); }
}
