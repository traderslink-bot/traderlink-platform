import type {
  TradeDetailLevelFactsUiContract,
  TradeDetailLevelFactsUiRow,
  TradeDetailLevelFactsUiTone,
  TradeDetailLevelFactsUiValue,
} from "@/src/lib/level-analysis/level-analysis-trade-detail-level-facts-ui-contract";

function toneClass(tone: TradeDetailLevelFactsUiTone): string {
  switch (tone) {
    case "success":
      return "text-emerald-300";
    case "warning":
      return "text-amber-300";
    case "notice":
      return "text-amber-200";
    case "safety":
      return "text-sky-300";
    case "info":
      return "text-zinc-300";
    case "muted":
      return "text-zinc-500";
    default:
      return "text-zinc-400";
  }
}

function badgeClass(tone: TradeDetailLevelFactsUiTone): string {
  switch (tone) {
    case "success":
      return "border-emerald-900 bg-emerald-950/20 text-emerald-300";
    case "warning":
    case "notice":
      return "border-amber-900 bg-amber-950/20 text-amber-300";
    case "safety":
      return "border-sky-900 bg-sky-950/30 text-sky-300";
    case "info":
      return "border-zinc-800 bg-zinc-950 text-zinc-300";
    default:
      return "border-zinc-900 bg-zinc-950 text-zinc-500";
  }
}

function formatNumber(value: number, unit?: string): string {
  const formatted =
    Math.abs(value) >= 10 ? value.toFixed(2) : Number(value.toFixed(4)).toString();

  return unit === "pct" ? `${formatted}%` : formatted;
}

function formatValue(value: TradeDetailLevelFactsUiValue): string {
  if (value.kind === "empty" || value.value === null) {
    return "not supplied";
  }

  if (value.kind === "number" && typeof value.value === "number") {
    return formatNumber(value.value, value.unit);
  }

  if (value.kind === "boolean" && typeof value.value === "boolean") {
    return value.value ? "yes" : "no";
  }

  if (value.kind === "list" && Array.isArray(value.value)) {
    return value.value.length > 0 ? value.value.join(" / ") : "none";
  }

  return String(value.value);
}

function LevelFactsRow({ row }: { row: TradeDetailLevelFactsUiRow }) {
  return (
    <div className="border-t border-zinc-900 py-2" data-testid={`level-facts-row-${row.id}`}>
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 text-xs uppercase tracking-wide text-zinc-500">
          {row.label}
        </div>
        <div
          className={`min-w-0 break-words text-left text-sm sm:max-w-[60%] sm:text-right ${toneClass(row.tone)}`}
        >
          {formatValue(row.value)}
        </div>
      </div>
      {row.detail ? (
        <div className="mt-1 break-words text-xs text-zinc-500">{row.detail}</div>
      ) : null}
    </div>
  );
}

export function TradeDetailLevelFactsAvailabilityLine({
  contract,
}: {
  contract: TradeDetailLevelFactsUiContract | null;
}) {
  if (!contract?.availabilityLine.shouldRender) {
    return null;
  }

  return (
    <div
      className={`mt-3 border-l border-zinc-800 pl-3 text-sm leading-6 ${toneClass(contract.availabilityLine.tone)}`}
      data-testid="trade-detail-level-facts-availability"
    >
      <span className="font-semibold">{contract.availabilityLine.label}</span>
      <span className="text-zinc-500"> - {contract.availabilityLine.detail}</span>
    </div>
  );
}

export function TradeDetailLevelFactsPanel({
  contract,
}: {
  contract: TradeDetailLevelFactsUiContract | null;
}) {
  if (!contract?.factsPanel.shouldRender) {
    return null;
  }

  return (
    <div
      className="border-t border-zinc-900 py-3"
      data-testid="trade-detail-level-facts-panel"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-zinc-100">
            {contract.factsPanel.title}
          </h3>
          <div className="mt-1 text-xs leading-5 text-zinc-500">
            Compact chart-context facts attached to this trade.
          </div>
        </div>
        <div className="text-xs uppercase tracking-wide text-zinc-500">
          {contract.status.replaceAll("_", " ")}
        </div>
      </div>

      <div className="mt-4 grid gap-4">
        {contract.factsPanel.sections.map((section) => (
          <section key={section.id} data-testid={`level-facts-section-${section.id}`}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  {section.title}
                </h4>
                <div className="mt-1 text-xs leading-5 text-zinc-600">
                  {section.detail}
                </div>
              </div>
              {section.badges.length > 0 ? (
                <div className="flex flex-wrap gap-2 sm:justify-end">
                  {section.badges.map((badge) => (
                    <span
                      className={`inline-flex border px-2 py-1 text-[11px] uppercase tracking-wide ${badgeClass(badge.tone)}`}
                      key={badge.id}
                    >
                      {badge.label}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="mt-2">
              {section.rows.map((row) => (
                <LevelFactsRow key={row.id} row={row} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
