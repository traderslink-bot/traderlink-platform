"use client";

import Link from "next/link";
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

  function reviewStatusLabel(status: string): string {
    if (status === "complete") {
      return "Complete";
    }

    if (status === "todo") {
      return "To do";
    }

    return status.replaceAll("_", " ");
  }

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
    setStatusMessage(
      "Review note saved. Mark checklist steps complete, then check coach or progress.",
    );
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

    setStatusMessage(
      status === "complete"
        ? "Review progress saved. Finish the remaining items, then check coach or progress."
        : "Review progress saved.",
    );
    setPendingId(null);
    router.refresh();
  }

  return (
    <section
      id="review-notes"
      className="grid gap-6 xl:grid-cols-2"
      data-testid="persisted-review-actions"
    >
      <div className="ti-panel p-4">
        <h2 className="text-sm font-semibold text-zinc-100">
          Write The Review Note
        </h2>
        <div className="mt-1 text-sm text-zinc-500">
          Write one short lesson while the replay is still in front of you:
          what happened, what behavior mattered, and what you will fix first.
        </div>
        <div className="mt-4 grid gap-2 md:grid-cols-3">
          {[
            "What happened?",
            "What behavior mattered?",
            "What is the fix-first rule?",
          ].map((prompt) => (
            <div
              className="border border-zinc-800 bg-zinc-950/70 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-400"
              key={prompt}
            >
              {prompt}
            </div>
          ))}
        </div>
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
          className="mt-4 min-h-24 w-full rounded-md border border-zinc-800 bg-slate-900/80 p-3 text-sm text-zinc-100 outline-none focus:border-sky-500"
          data-testid="trade-note-input"
          onChange={(event) => setNoteBody(event.target.value)}
          placeholder="Example: I added after the trade weakened. Next time I will wait for a clear reason before adding size."
          value={noteBody}
        />
        <button
          className="mt-3 border border-sky-800 bg-sky-950/40 px-4 py-2 text-sm font-medium text-sky-100 disabled:cursor-not-allowed disabled:opacity-50"
          data-testid="save-trade-note-button"
          disabled={pendingId === "note"}
          onClick={saveNote}
          type="button"
        >
          {pendingId === "note" ? "Saving..." : "Save Review Note"}
        </button>
        <div className="mt-2 text-xs text-zinc-500" data-testid="review-save-status">
          {statusMessage}
        </div>
      </div>

      <div className="ti-panel p-4">
        <h2 className="text-sm font-semibold text-zinc-100">
          Save Review Progress
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
                    {reviewStatusLabel(item.status)}
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

      <div
        className="ti-coach-brief p-5 xl:col-span-2"
        data-testid="review-completion-handoff"
      >
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              After Saving This Review
            </p>
            <h2 className="mt-2 text-xl font-semibold text-slate-950">
              Turn the trade into progress follow-through.
            </h2>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
              A saved note is the lesson. Completed checklist items are what move
              this from imported history into reviewed work the coach can use.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 lg:justify-end">
            <Link
              className="inline-flex items-center justify-center rounded-md border border-slate-950 bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              href="/coach/progress"
            >
              Back to Coach
            </Link>
            <Link
              className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white/70 px-4 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-500"
              href="/progress#progress-follow-through"
            >
              Check Progress
            </Link>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <Link
            className="text-slate-700 underline-offset-4 hover:underline"
            href="/review?queue=highest_priority"
          >
            Continue review queue
          </Link>
          <span className="text-slate-400">/</span>
          <Link
            className="text-slate-700 underline-offset-4 hover:underline"
            href="/trades"
          >
            Browse saved trades
          </Link>
        </div>
      </div>
    </section>
  );
}
