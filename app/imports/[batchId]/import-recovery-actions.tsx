"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { importStatusLabel } from "../../../src/lib/trader-analytics/product/import-user-copy";
import type {
  ImportRecoveryAction,
  ImportRecoveryReadModel,
} from "../../../src/lib/trader-analytics/server/import-recovery-read-model";

function toneClass(tone: ImportRecoveryAction["tone"]): string {
  return tone === "success"
    ? "border-emerald-800 bg-emerald-950/20 text-emerald-200 hover:border-emerald-400"
    : tone === "warning"
      ? "border-amber-800 bg-amber-950/20 text-amber-200 hover:border-amber-400"
      : tone === "danger"
        ? "border-rose-800 bg-rose-950/20 text-rose-200 hover:border-rose-400"
        : tone === "muted"
          ? "border-zinc-800 text-zinc-300 hover:border-zinc-500"
          : "border-sky-800 bg-sky-950/30 text-sky-100 hover:border-sky-400";
}

function statusTone(status: ImportRecoveryReadModel["status"]): string {
  return status === "committed" || status === "ready_to_save"
    ? "text-emerald-300"
    : status === "blocked_by_repairs" || status === "blocked"
      ? "text-rose-300"
      : status === "discarded"
        ? "text-zinc-400"
        : "text-amber-300";
}

export function ImportRecoveryActions({
  batchId,
  recovery,
}: {
  batchId: string;
  recovery: ImportRecoveryReadModel;
}) {
  const router = useRouter();
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function runAction(action: ImportRecoveryAction) {
    if (action.kind === "save_import") {
      setPendingAction(action.id);
      setMessage("Saving import...");
      const response = await fetch(
        `/api/import-batches/${encodeURIComponent(batchId)}/commit`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({}),
        },
      );
      setPendingAction(null);
      setMessage(
        response.ok
          ? "Import saved. Reports and review work are updating."
          : "Import could not be saved from this preview.",
      );
      router.refresh();
      return;
    }

    if (action.kind === "discard_preview") {
      setPendingAction(action.id);
      setMessage("Discarding preview...");
      const response = await fetch(
        `/api/import-batches/${encodeURIComponent(batchId)}/discard`,
        { method: "POST" },
      );
      setPendingAction(null);
      setMessage(
        response.ok
          ? "Preview discarded."
          : "Preview could not be discarded.",
      );
      router.refresh();
    }
  }

  function renderAction(action: ImportRecoveryAction, primary = false) {
    const className = `${primary ? "px-4 py-3" : "px-3 py-2"} inline-flex min-h-10 items-center justify-center border text-sm font-medium transition ${toneClass(action.tone)}`;

    if (action.kind === "link" || action.kind === "section_anchor") {
      return (
        <Link className={className} href={action.href ?? "#"} key={action.id}>
          {action.label}
        </Link>
      );
    }

    return (
      <button
        className={`${className} disabled:opacity-50`}
        disabled={pendingAction === action.id}
        key={action.id}
        onClick={() => runAction(action)}
        type="button"
      >
        {pendingAction === action.id ? "Working..." : action.label}
      </button>
    );
  }

  return (
    <section
      className="ti-panel p-4"
      data-testid="import-recovery-actions"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Recovery Lane
          </p>
          <h2 className={`mt-2 text-lg font-semibold ${statusTone(recovery.status)}`}>
            {recovery.title}
          </h2>
          <div className="mt-1 text-xs uppercase tracking-wide text-zinc-500">
            {importStatusLabel(recovery.status)}
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
            {recovery.detail}
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {[
              ["Open repairs", recovery.counts.openRepairs],
              ["Fix required", recovery.counts.fixRequiredRepairs],
              ["Review decisions", recovery.counts.reviewDecisions],
              ["Blockers", recovery.counts.blockers],
              ["Duplicates", recovery.counts.duplicateTrades],
              ["Trades", recovery.counts.savedTrades],
            ].map(([label, value]) => (
              <div className="border border-zinc-900 px-3 py-2" key={label}>
                <div className="text-xs uppercase tracking-wide text-zinc-500">
                  {label}
                </div>
                <div className="mt-1 font-mono text-lg text-zinc-100">
                  {value}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-3 lg:w-80">
          {renderAction(recovery.primaryAction, true)}
          {recovery.secondaryActions.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {recovery.secondaryActions.map((action) => renderAction(action))}
            </div>
          ) : null}
          <div className="min-h-5 text-xs text-zinc-500" data-testid="import-recovery-message">
            {message}
          </div>
        </div>
      </div>

      {recovery.duplicate.duplicateFile ||
      recovery.duplicate.duplicateTrades.length > 0 ? (
        <div
          className="mt-5 border-t border-zinc-900 pt-4"
          data-testid="duplicate-details"
          id="duplicate-details"
        >
          <h3 className="text-sm font-semibold text-zinc-100">
            Duplicate Review Details
          </h3>
          <p className="mt-1 text-xs leading-5 text-zinc-500">
            Duplicate matches are review blocks. Use the original saved
            import or existing saved trade unless there is a deliberate reason
            to re-import.
          </p>
          <div className="mt-3 grid gap-2 text-sm">
            {recovery.duplicate.originalBatchHref ? (
              <Link
                className="text-sky-300 hover:text-sky-200"
                href={recovery.duplicate.originalBatchHref}
              >
                Original saved import: {recovery.duplicate.originalBatchId}
              </Link>
            ) : recovery.duplicate.duplicateFile ? (
              <div className="text-amber-300">
                File fingerprint matched a saved import, but the original
                batch could not be linked.
              </div>
            ) : null}
            {recovery.duplicate.duplicateTrades.map((trade) => (
              <Link
                className="text-sky-300 hover:text-sky-200"
                href={trade.href}
                key={trade.id}
              >
                Existing trade: {trade.symbol} / {importStatusLabel(trade.lifecycleStatus)} /{" "}
                {trade.openedAt.slice(0, 10)}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
