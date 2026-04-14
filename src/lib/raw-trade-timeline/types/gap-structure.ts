// 2026-04-14
// PURPOSE:
// Defines the normalized gap-structure bundle for Layer 1 structural context.

export interface GapBoundary {
  start: number;
  end: number;
  direction: "up" | "down";
  filled: boolean;
}

export interface GapStructure {
  gapAbove: GapBoundary | null;
  gapBelow: GapBoundary | null;
}
