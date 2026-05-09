"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ImportCommitRepairItemRecord } from "../../../src/lib/trader-analytics/product/import-commit/import-commit-planner";

function toneClass(status: string): string {
  return status === "resolved"
    ? "text-emerald-300"
    : status === "dismissed" || status === "skipped"
      ? "text-zinc-400"
      : "text-amber-300";
}

export function ImportRepairActions({
  batchId,
  repairItems,
}: {
  batchId: string;
  repairItems: ImportCommitRepairItemRecord[];
}) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function setRepairStatus(
    repairItemId: string,
    status: ImportCommitRepairItemRecord["status"],
  ) {
    setPendingId(`${repairItemId}:${status}`);
    setMessage("Saving repair state...");
    const response = await fetch(
      `/api/import-batches/${encodeURIComponent(batchId)}/repair-items/${encodeURIComponent(repairItemId)}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status }),
      },
    );

    if (!response.ok) {
      setPendingId(null);
      setMessage("Repair state could not be saved.");
      return;
    }

    setPendingId(null);
    setMessage("Repair state saved.");
    router.refresh();
  }

  return (
    <section
      className="border border-zinc-800 bg-zinc-950 p-4"
      data-testid="import-repair-actions"
      id="repair-actions"
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-zinc-100">
            Repair Actions
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            Review, resolve, or dismiss import repair items. These actions track
            review state; corrected row values should be carried forward from a
            repaired CSV preview before saving.
          </p>
        </div>
        <div className="text-xs text-zinc-500" data-testid="repair-action-message">
          {message}
        </div>
      </div>
      <div className="mt-4 grid gap-3">
        {repairItems.length === 0 ? (
          <div className="text-sm text-emerald-300">
            No repair actions are open for this import.
          </div>
        ) : (
          repairItems.map((item) => (
            <div key={item.id} className="border-t border-zinc-900 py-3">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="text-sm font-medium text-zinc-100">
                    {item.title}
                  </div>
                  <div className="mt-1 text-xs text-zinc-500">{item.detail}</div>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs uppercase tracking-wide">
                    <span className="text-zinc-500">{item.severity}</span>
                    <span
                      className={toneClass(item.status)}
                      data-testid={`repair-item-${item.id}-status`}
                    >
                      {item.status}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    className="border border-emerald-900 px-2 py-1 text-xs text-emerald-300 disabled:opacity-50"
                    data-testid={`repair-item-${item.id}-resolved`}
                    disabled={pendingId === `${item.id}:resolved`}
                    onClick={() => setRepairStatus(item.id, "resolved")}
                    type="button"
                  >
                    Resolved
                  </button>
                  <button
                    className="border border-zinc-800 px-2 py-1 text-xs text-zinc-400 disabled:opacity-50"
                    data-testid={`repair-item-${item.id}-dismissed`}
                    disabled={pendingId === `${item.id}:dismissed`}
                    onClick={() => setRepairStatus(item.id, "dismissed")}
                    type="button"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
