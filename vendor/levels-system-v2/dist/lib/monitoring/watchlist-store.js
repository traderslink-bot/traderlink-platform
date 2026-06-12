// 2026-04-14 09:28 PM America/Toronto
// In-memory watchlist store with manual activate/deactivate operations.
function normalizeSymbol(symbol) {
    return symbol.trim().toUpperCase();
}
function normalizeFiniteTimestamp(value) {
    return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}
export class WatchlistStore {
    entries = new Map();
    normalizeEntry(entry) {
        const lifecycle = entry.lifecycle ?? (entry.active ? "active" : "inactive");
        const activatedAt = normalizeFiniteTimestamp(entry.activatedAt);
        const lastLevelPostAt = normalizeFiniteTimestamp(entry.lastLevelPostAt);
        const lastExtensionPostAt = normalizeFiniteTimestamp(entry.lastExtensionPostAt);
        return {
            symbol: normalizeSymbol(entry.symbol),
            active: entry.active,
            priority: entry.priority,
            tags: [...entry.tags],
            note: entry.note?.trim() || undefined,
            discordThreadId: entry.discordThreadId?.trim() || null,
            lifecycle,
            refreshPending: entry.refreshPending ?? false,
            ...(activatedAt !== undefined ? { activatedAt } : {}),
            ...(lastLevelPostAt !== undefined ? { lastLevelPostAt } : {}),
            ...(lastExtensionPostAt !== undefined ? { lastExtensionPostAt } : {}),
        };
    }
    getNextPriority() {
        const currentMax = [...this.entries.values()].reduce((max, entry) => Math.max(max, entry.priority), 0);
        return currentMax + 1;
    }
    setEntries(entries) {
        this.entries.clear();
        for (const entry of entries) {
            const normalized = this.normalizeEntry(entry);
            this.entries.set(normalized.symbol, normalized);
        }
    }
    getEntries() {
        return [...this.entries.values()]
            .map((entry) => this.normalizeEntry(entry))
            .sort((a, b) => a.priority - b.priority || a.symbol.localeCompare(b.symbol));
    }
    getEntry(symbol) {
        const entry = this.entries.get(normalizeSymbol(symbol));
        return entry ? this.normalizeEntry(entry) : undefined;
    }
    upsertManualEntry(input) {
        const symbol = normalizeSymbol(input.symbol);
        const existing = this.entries.get(symbol);
        const entry = {
            symbol,
            active: input.active,
            priority: existing?.priority ?? this.getNextPriority(),
            tags: existing?.tags ? [...existing.tags] : ["manual"],
            note: typeof input.note === "string" && input.note.trim().length > 0
                ? input.note.trim()
                : existing?.note,
            discordThreadId: input.discordThreadId !== undefined
                ? input.discordThreadId?.trim() || null
                : existing?.discordThreadId ?? null,
            lifecycle: input.lifecycle ?? existing?.lifecycle ?? (input.active ? "active" : "inactive"),
            activatedAt: normalizeFiniteTimestamp(input.activatedAt) ??
                existing?.activatedAt ??
                (input.active ? Date.now() : undefined),
            lastLevelPostAt: normalizeFiniteTimestamp(input.lastLevelPostAt) ?? existing?.lastLevelPostAt,
            lastExtensionPostAt: normalizeFiniteTimestamp(input.lastExtensionPostAt) ?? existing?.lastExtensionPostAt,
            refreshPending: input.refreshPending ?? existing?.refreshPending ?? false,
        };
        this.entries.set(symbol, entry);
        return this.normalizeEntry(entry);
    }
    patchEntry(symbol, patch) {
        const normalizedSymbol = normalizeSymbol(symbol);
        const existing = this.entries.get(normalizedSymbol);
        if (!existing) {
            return null;
        }
        const updated = this.normalizeEntry({
            ...existing,
            ...patch,
            symbol: normalizedSymbol,
        });
        this.entries.set(normalizedSymbol, updated);
        return updated;
    }
    deactivateSymbol(symbol) {
        const normalizedSymbol = normalizeSymbol(symbol);
        const existing = this.entries.get(normalizedSymbol);
        if (!existing) {
            return null;
        }
        const updated = {
            ...existing,
            active: false,
            lifecycle: "inactive",
            refreshPending: false,
        };
        this.entries.set(normalizedSymbol, updated);
        return this.normalizeEntry(updated);
    }
    getActiveEntries() {
        return this.getEntries().filter((entry) => entry.active);
    }
}
