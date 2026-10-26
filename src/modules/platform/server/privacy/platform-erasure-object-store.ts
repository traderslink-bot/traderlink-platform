import { closeSync, fsyncSync, lstatSync, openSync, realpathSync } from "node:fs";
import { dirname, join } from "node:path";
import { createHash } from "node:crypto";
import { purgeJournalEvidenceObject, resolveJournalEvidenceVaultBoundaryForExistingObjects, verifyJournalEvidenceObject } from "@/src/modules/journal/server/imports/journal-evidence-vault";
import { purgeJournalSupportSource, readJournalSupportSource, resolveJournalSupportSourceVault } from "@/src/modules/journal/server/administration/journal-support-source-vault";
import type { PlatformErasureArtifact } from "./platform-erasure-service";
import type { ErasureObjectStore } from "./platform-erasure-recovery";

/** Existing vault resolvers enforce protected roots and purpose separation.
 * Resolve afresh on recovery: never trust a path persisted in an IPC payload.
 */
export function createErasureObjectStore(databasePath: string): ErasureObjectStore {
  const locate = (artifact: PlatformErasureArtifact) => {
    if (artifact.kind === "primary_evidence") {
      const namespace = /^(ibkr|mapped_csv)\/[0-9a-f]{64}\.csv$/u.exec(artifact.evidenceObjectKey)?.[1];
      if (namespace !== "ibkr" && namespace !== "mapped_csv") throw new Error("erasure_object_key");
      const vault = resolveJournalEvidenceVaultBoundaryForExistingObjects({ databasePath });
      return { root: vault.rootPath, path: join(vault.rootPath, artifact.evidenceObjectKey), namespace: namespace as "ibkr" | "mapped_csv", vault };
    }
    if (!/^[A-Za-z0-9_-]{32,160}$/u.test(artifact.objectKey)) throw new Error("erasure_object_key");
    const vault = resolveJournalSupportSourceVault({ databasePath });
    return { root: vault.rootPath, path: join(vault.rootPath, artifact.objectKey), namespace: null, vault };
  };
  const syncDirectory = (artifact: PlatformErasureArtifact) => {
    const directory = dirname(locate(artifact).path);
    const status = lstatSync(directory);
    if (!status.isDirectory() || status.isSymbolicLink() || realpathSync(directory) !== directory) throw new Error("erasure_directory_identity");
    const fd = openSync(directory, "r");
    try { fsyncSync(fd); } finally { closeSync(fd); }
  };
  return {
    identity(artifact) {
      const { root, path } = locate(artifact);
      const parent = dirname(path);
      const status = lstatSync(parent);
      if (!status.isDirectory() || status.isSymbolicLink() || realpathSync(parent) !== parent) throw new Error("erasure_directory_identity");
      return createHash("sha256").update(JSON.stringify([root, parent, status.dev, status.ino])).digest("hex");
    },
    exists(artifact) {
      try { lstatSync(locate(artifact).path); return true; }
      catch (error) {
        if (typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT") return false;
        throw error;
      }
    },
    verify(artifact) {
      const resolved = locate(artifact);
      if (artifact.kind === "primary_evidence" && resolved.namespace) {
        verifyJournalEvidenceObject(resolved.vault, { ...artifact, evidenceNamespace: resolved.namespace });
      } else if (artifact.kind === "support_source") {
        readJournalSupportSource({ vault: resolved.vault, objectKey: artifact.objectKey,
          expectedSha256: artifact.sourceFileSha256, expectedSizeBytes: artifact.sourceFileSizeBytes });
      }
      // Prove directory flush support before the logical deletion commits.
      syncDirectory(artifact);
    },
    purge(artifact) {
      const resolved = locate(artifact);
      if (artifact.kind === "primary_evidence" && resolved.namespace) {
        purgeJournalEvidenceObject(resolved.vault, { ...artifact, evidenceNamespace: resolved.namespace });
      } else if (artifact.kind === "support_source") {
        purgeJournalSupportSource({ vault: resolved.vault, objectKey: artifact.objectKey,
          expectedSha256: artifact.sourceFileSha256, expectedSizeBytes: artifact.sourceFileSizeBytes,
          purgedAtUtc: new Date().toISOString() });
      }
      syncDirectory(artifact);
    },
    syncDirectory,
  };
}
