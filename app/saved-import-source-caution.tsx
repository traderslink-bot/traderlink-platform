import Link from "next/link";
import type { SavedImportSourceCautionReadModel } from "../src/lib/trader-analytics/server/saved-import-source-caution";

export function SavedImportSourceCaution({
  caution,
  surface,
}: {
  caution?: SavedImportSourceCautionReadModel | null;
  surface: "analytics" | "coach" | "review" | "trade";
}) {
  if (!caution?.repairedImport) {
    return null;
  }

  const detail =
    surface === "trade"
      ? "This trade came from repaired CSV rows. Review repaired row values before treating coaching evidence as final."
      : caution.detail;

  return (
    <section
      className="border border-amber-900 bg-amber-950/20 p-4"
      data-testid={`${surface}-repaired-import-caution`}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-amber-300">
            {caution.title}
          </div>
          <div className="mt-2 text-sm leading-6 text-amber-100">{detail}</div>
          <div className="mt-2 text-xs text-zinc-500">
            {caution.relatedTradeIds.length} related saved trade
            {caution.relatedTradeIds.length === 1 ? "" : "s"}.
          </div>
        </div>
        {caution.href ? (
          <Link
            className="text-sm text-amber-200 hover:text-amber-100"
            href={caution.href}
          >
            Open import
          </Link>
        ) : null}
      </div>
    </section>
  );
}
