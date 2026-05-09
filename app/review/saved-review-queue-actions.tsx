"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type QueueAction = "reviewed" | "resolved" | "ignored";

const ACTION_LABELS: Record<QueueAction, string> = {
  reviewed: "Mark reviewed",
  resolved: "Resolve",
  ignored: "Ignore",
};

export function SavedReviewQueueActions({
  tradeId,
  currentStatus,
}: {
  tradeId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<QueueAction | null>(null);
  const [message, setMessage] = useState("");

  async function setStatus(status: QueueAction) {
    setPending(status);
    setMessage("Saving...");
    const response = await fetch(
      `/api/trades/${encodeURIComponent(tradeId)}/review-status`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status }),
      },
    );

    if (!response.ok) {
      setMessage("Could not update review status.");
      setPending(null);
      return;
    }

    setMessage(`Saved as ${status}.`);
    setPending(null);
    router.refresh();
  }

  return (
    <div
      className="flex flex-col gap-2 md:items-end"
      data-testid={`saved-review-queue-actions-${tradeId}`}
    >
      <div className="flex flex-wrap gap-2">
        {(["reviewed", "resolved", "ignored"] as QueueAction[]).map((action) => (
          <button
            key={action}
            className="border border-zinc-800 px-2 py-1 text-xs text-zinc-300 hover:border-sky-500 hover:text-sky-200 disabled:cursor-not-allowed disabled:opacity-50"
            data-testid={`saved-review-queue-action-${tradeId}-${action}`}
            disabled={pending !== null || currentStatus === action}
            onClick={() => setStatus(action)}
            type="button"
          >
            {pending === action ? "Saving..." : ACTION_LABELS[action]}
          </button>
        ))}
      </div>
      <div
        className="min-h-4 text-right text-xs text-zinc-500"
        data-testid={`saved-review-queue-action-message-${tradeId}`}
      >
        {message}
      </div>
    </div>
  );
}
