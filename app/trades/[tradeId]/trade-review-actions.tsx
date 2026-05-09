"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type {
  SavedReportNote,
  TradeReviewChecklist,
} from "../../../src/lib/trader-analytics/product/types";

export function TradeReviewActions({
  tradeId,
  checklist,
  notes,
}: {
  tradeId: string;
  checklist: TradeReviewChecklist | null;
  notes: SavedReportNote[];
}) {
  const router = useRouter();
  const [noteBody, setNoteBody] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function saveNote() {
    const trimmed = noteBody.trim();
    if (!trimmed) {
      setStatusMessage("Write a note before saving.");
      return;
    }

    setPendingId("note");
    setStatusMessage("Saving note...");
    const response = await fetch(`/api/trades/${encodeURIComponent(tradeId)}/notes`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ body: trimmed }),
    });

    if (!response.ok) {
      setStatusMessage("Note could not be saved.");
      setPendingId(null);
      return;
    }

    setNoteBody("");
    setStatusMessage("Note saved.");
    setPendingId(null);
    router.refresh();
  }

  async function setReviewItemStatus(itemId: string, status: string) {
    setPendingId(`${itemId}:${status}`);
    setStatusMessage("Saving review progress...");
    const response = await fetch(
      `/api/trades/${encodeURIComponent(tradeId)}/review-items/${encodeURIComponent(itemId)}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status }),
      },
    );

    if (!response.ok) {
      setStatusMessage("Review progress could not be saved.");
      setPendingId(null);
      return;
    }

    setStatusMessage("Review progress saved.");
    setPendingId(null);
    router.refresh();
  }

  return (
    <section
      className="grid gap-6 xl:grid-cols-2"
      data-testid="persisted-review-actions"
    >
      <div className="border border-zinc-800 bg-zinc-950 p-4">
        <h2 className="text-sm font-semibold text-zinc-100">Saved Notes</h2>
        <div className="mt-4 grid gap-3">
          {notes.length === 0 ? (
            <div className="text-sm text-zinc-500">
              No saved notes for this trade yet.
            </div>
          ) : (
            notes.map((note) => (
              <div key={note.id} className="border-t border-zinc-900 py-3">
                <div className="font-mono text-xs text-zinc-500">
                  {note.createdAt}
                </div>
                <div className="mt-2 text-sm text-zinc-300">{note.body}</div>
              </div>
            ))
          )}
        </div>
        <textarea
          className="mt-4 min-h-24 w-full border border-zinc-800 bg-zinc-950 p-3 text-sm text-zinc-100 outline-none focus:border-sky-500"
          data-testid="trade-note-input"
          onChange={(event) => setNoteBody(event.target.value)}
          placeholder="Capture one sentence about what to repeat or avoid."
          value={noteBody}
        />
        <button
          className="mt-3 border border-sky-800 bg-sky-950/40 px-4 py-2 text-sm font-medium text-sky-100 disabled:cursor-not-allowed disabled:opacity-50"
          data-testid="save-trade-note-button"
          disabled={pendingId === "note"}
          onClick={saveNote}
          type="button"
        >
          {pendingId === "note" ? "Saving..." : "Save Note"}
        </button>
        <div className="mt-2 text-xs text-zinc-500" data-testid="review-save-status">
          {statusMessage}
        </div>
      </div>

      <div className="border border-zinc-800 bg-zinc-950 p-4">
        <h2 className="text-sm font-semibold text-zinc-100">
          Persisted Checklist
        </h2>
        <div className="mt-1 text-sm text-zinc-500">
          Mark the steps you have actually reviewed. These choices survive reloads.
        </div>
        <div className="mt-4 grid gap-3">
          {(checklist?.items ?? []).map((item) => (
            <div key={item.id} className="border-t border-zinc-900 py-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="text-sm text-zinc-300">{item.label}</div>
                  <div
                    className="mt-1 text-xs uppercase tracking-wide text-zinc-500"
                    data-testid={`review-item-${item.id}-status`}
                  >
                    {item.status}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    className="border border-emerald-900 px-2 py-1 text-xs text-emerald-300 disabled:opacity-50"
                    data-testid={`review-item-${item.id}-complete`}
                    disabled={pendingId === `${item.id}:complete`}
                    onClick={() => setReviewItemStatus(item.id, "complete")}
                    type="button"
                  >
                    Complete
                  </button>
                  <button
                    className="border border-zinc-800 px-2 py-1 text-xs text-zinc-400 disabled:opacity-50"
                    data-testid={`review-item-${item.id}-todo`}
                    disabled={pendingId === `${item.id}:todo`}
                    onClick={() => setReviewItemStatus(item.id, "todo")}
                    type="button"
                  >
                    To Do
                  </button>
                </div>
              </div>
              <div className="mt-2 text-xs text-zinc-500">{item.evidence}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
