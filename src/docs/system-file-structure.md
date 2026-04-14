# System File Structure

// 2026-04-12 America/Toronto
// PURPOSE:
// Provides a full map of all files in the system.

---

## Core Structure

### Raw Layer
- raw-trade-timeline/
- execution-sources/
- market-data-sources/

### Pattern Input Layer
- pattern-input/

---

## Pattern Input

### `pattern-input/builders/build-pattern-input.ts`
Builds pattern-ready aggregated structure.

### `pattern-input/types/pattern-input.ts`
Defines pattern input contract.

---

## Notes

The system is layered:

1. Raw Trade Timeline Layer (Layer 1)
2. Pattern Input Layer (Layer 2)
3. Pattern Detection (next)