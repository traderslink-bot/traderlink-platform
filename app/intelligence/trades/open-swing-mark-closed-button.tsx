"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function OpenSwingMarkClosedButton({
  tradeId,
}: {
  tradeId: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );

  async function markClosed() {
    if (status === "saving") {
      return;
    }

    setStatus("saving");
    const response = await fetch(
      `/api/trades/${encodeURIComponent(tradeId)}/mark-closed`,
      { method: "POST" },
    );

    if (!response.ok) {
      setStatus("error");
      return;
    }

    setStatus("saved");
    router.refresh();
  }

  return (
    <div className="mt-3 border-t border-zinc-900 pt-3">
      <button
        className="inline-flex items-center border border-sky-800 bg-sky-950/30 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-sky-100 transition hover:border-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
        data-testid={`mark-trade-closed-${tradeId}`}
        disabled={status === "saving" || status === "saved"}
        onClick={markClosed}
        type="button"
      >
        {status === "saving"
          ? "Saving"
          : status === "saved"
            ? "Marked closed"
            : "Mark position closed"}
      </button>
      {status === "error" ? (
        <div className="mt-2 text-xs text-rose-300">
          Could not update this trade. Try again from the trade detail page.
        </div>
      ) : null}
    </div>
  );
}
