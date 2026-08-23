"use client";

import { useEffect, useState } from "react";

type TransferPreview = Readonly<{
  status: "preview_ready";
  preview: Readonly<{
    previewSha256: string;
    modules: readonly Readonly<{
      module: string;
      counts: Readonly<{
        source: number;
        accepted: number;
        unchanged: number;
        pending: number;
        conflicts: number;
      }>;
    }>[];
  }>;
}>;

type TransferResult = Readonly<{
  status: "executed_and_reconciled";
  reconciliationSha256: string;
}>;

function message(value: unknown): string {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return "The saved records could not be checked.";
  }
  const code = (value as Record<string, unknown>).code;
  return typeof code === "string"
    ? `The restore could not run: ${code}.`
    : "The saved records could not be checked.";
}

export default function HostedTransferExecutePage() {
  const [preview, setPreview] = useState<TransferPreview | null>(null);
  const [result, setResult] = useState<TransferResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    void fetch("/api/admin/journal/hosted-transfer/preview", { cache: "no-store" })
      .then(async (response) => {
        const payload: unknown = await response.json();
        if (!response.ok || !payload || typeof payload !== "object" ||
          (payload as { status?: unknown }).status !== "preview_ready") {
          throw new Error(message(payload));
        }
        setPreview(payload as TransferPreview);
      })
      .catch((reason: unknown) => {
        setError(reason instanceof Error ? reason.message : "The saved records could not be checked.");
      })
      .finally(() => setChecking(false));
  }, []);

  async function restore(): Promise<void> {
    if (!preview || restoring) return;
    setRestoring(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/journal/hosted-transfer/execute", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-traderlink-journal-admin-request": "1",
          "x-traderlink-journal-admin-idempotency-key": crypto.randomUUID(),
        },
        body: JSON.stringify({ previewSha256: preview.preview.previewSha256 }),
      });
      const payload: unknown = await response.json();
      if (!response.ok || !payload || typeof payload !== "object" ||
        (payload as { status?: unknown }).status !== "executed_and_reconciled") {
        throw new Error(message(payload));
      }
      setResult(payload as TransferResult);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The restore could not run.");
    } finally {
      setRestoring(false);
    }
  }

  return (
    <main style={{ maxWidth: 720, margin: "48px auto", padding: "0 24px" }}>
      <h1>Restore saved records</h1>
      {checking && !preview ? <p>Checking the saved records…</p> : null}
      {error ? <p role="alert">{error}</p> : null}
      {preview ? (
        <>
          <ul>
            {preview.preview.modules.map((module) => (
              <li key={module.module}>
                {module.module}: {module.counts.accepted} ready to restore
                {module.counts.unchanged ? `, ${module.counts.unchanged} already here` : ""}
              </li>
            ))}
          </ul>
          <button type="button" disabled={restoring || result !== null} onClick={() => void restore()}>
            {result ? "Restored" : restoring ? "Restoring…" : "Restore saved records"}
          </button>
        </>
      ) : null}
      {result ? <p>Saved records restored and reconciled.</p> : null}
    </main>
  );
}
