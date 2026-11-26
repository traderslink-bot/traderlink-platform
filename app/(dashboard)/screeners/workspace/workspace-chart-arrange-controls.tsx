"use client";

import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import { alpha } from "@mui/material/styles";
import DragIndicator from "@mui/icons-material/DragIndicator";
import { useRef, useState, type PointerEvent } from "react";
import { resizeWorkspaceChartTracks } from "./workspace-chart-arrangement";

type Axis = "column" | "row";
type Tracks = { sizes: readonly number[]; space: number; minimum: number };
type Drag = { pointer: number; id: string; x: number; y: number; moved: boolean };
type Resize = { pointer: number; start: number; move: (point: number) => void; cancel: () => void };

export function workspaceChartGridTracks(sizes: readonly number[]) {
  return sizes.map(size => `minmax(0, ${size}fr)`).join(" ");
}

export function WorkspaceChartArrangeControls({ panels, columns, rows, gap, tabs, onSwap, onResize }: {
  panels: readonly { id: string; label: string }[];
  columns: Tracks;
  rows: Tracks;
  gap: number;
  tabs: boolean;
  onSwap: (source: string, target: string) => void;
  onResize: (axis: Axis, sizes: readonly number[]) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const drag = useRef<Drag | null>(null);
  const resize = useRef<Resize | null>(null);
  const ignoreClick = useRef(false);

  const pick = (id: string) => {
    if (!selected) { setSelected(id); return; }
    onSwap(selected, id);
    setSelected(null);
  };
  const startDrag = (event: PointerEvent<HTMLButtonElement>, id: string) => {
    if (!event.isPrimary || event.button !== 0) return;
    ignoreClick.current = false;
    drag.current = { pointer: event.pointerId, id, x: event.clientX, y: event.clientY, moved: false };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const moveDrag = (event: PointerEvent<HTMLButtonElement>) => {
    const active = drag.current;
    if (active?.pointer === event.pointerId && Math.hypot(event.clientX - active.x, event.clientY - active.y) >= 5) {
      active.moved = true;
      setSelected(active.id);
    }
  };
  const endDrag = (event: PointerEvent<HTMLButtonElement>) => {
    const active = drag.current;
    if (active?.pointer !== event.pointerId) return;
    drag.current = null;
    if (!active.moved) return;
    ignoreClick.current = true;
    const target = event.currentTarget.ownerDocument.elementFromPoint(event.clientX, event.clientY)
      ?.closest<HTMLElement>("[data-workspace-arrange-slot]")?.dataset.workspaceArrangeSlot;
    if (target) onSwap(active.id, target);
    setSelected(null);
  };
  const cancelDrag = (event: PointerEvent<HTMLButtonElement>) => {
    if (drag.current?.pointer !== event.pointerId) return;
    drag.current = null;
    setSelected(null);
  };

  const divider = (axis: Axis, tracks: Tracks, boundary: number) => {
    const vertical = axis === "column";
    const { sizes, minimum, space } = tracks;
    const position = sizes.slice(0, boundary + 1).reduce((sum, size) => sum + size, 0);
    const offset = (boundary + 0.5 - position * (sizes.length - 1)) * gap;
    const coordinate = (event: PointerEvent<HTMLButtonElement>) => vertical ? event.clientX : event.clientY;
    const adjust = (delta: number) => onResize(axis, resizeWorkspaceChartTracks(sizes, boundary, delta, minimum));
    const line = vertical ? { width: 2, height: "100%" } : { height: 2, width: "100%" };
    return <ButtonBase key={`${axis}-${boundary}`} type="button" role="separator"
      aria-label={vertical ? `Resize chart columns ${boundary + 1} and ${boundary + 2}` : `Resize chart rows ${boundary + 1} and ${boundary + 2}`}
      aria-orientation={vertical ? "vertical" : "horizontal"}
      aria-valuemin={Math.round((position - sizes[boundary] + minimum) * 100)}
      aria-valuemax={Math.round((position + sizes[boundary + 1] - minimum) * 100)}
      aria-valuenow={Math.round(position * 100)}
      onPointerDown={event => {
        if (!event.isPrimary || event.button !== 0 || space <= 0) return;
        const start = coordinate(event);
        resize.current = { pointer: event.pointerId, start, move: point => adjust((point - start) / space), cancel: () => onResize(axis, sizes) };
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={event => {
        if (resize.current?.pointer === event.pointerId) resize.current.move(coordinate(event));
      }}
      onPointerUp={event => {
        if (resize.current?.pointer !== event.pointerId) return;
        if (coordinate(event) !== resize.current.start) resize.current.move(coordinate(event));
        resize.current = null;
      }}
      onPointerCancel={cancelResize}
      onLostPointerCapture={cancelResize}
      onKeyDown={event => {
        const backward = vertical ? "ArrowLeft" : "ArrowUp";
        const forward = vertical ? "ArrowRight" : "ArrowDown";
        if (![backward, forward, "Home", "End"].includes(event.key)) return;
        event.preventDefault();
        adjust(event.key === "Home" ? -1 : event.key === "End" ? 1 : event.key === backward ? -0.04 : 0.04);
      }}
      sx={{
        position: "absolute", zIndex: 1, touchAction: "none", color: "primary.main",
        ...(vertical
          ? { top: 0, bottom: 0, width: { xs: 24, md: 16 }, left: `calc(${position * 100}% + ${offset}px)`, transform: "translateX(-50%)", cursor: "col-resize" }
          : { left: 0, right: 0, height: { xs: 24, md: 16 }, top: `calc(${position * 100}% + ${offset}px)`, transform: "translateY(-50%)", cursor: "row-resize" }),
        "&:hover, &.Mui-focusVisible": { bgcolor: "action.hover" },
      }}>
      <Box sx={{ ...line, bgcolor: "currentColor", pointerEvents: "none" }} />
    </ButtonBase>;
  };
  function cancelResize(event: PointerEvent<HTMLButtonElement>) {
    if (resize.current?.pointer !== event.pointerId) return;
    resize.current.cancel();
    resize.current = null;
  }

  return <Box role="group" aria-label="Chart positions" sx={{
    position: "absolute", inset: 0, zIndex: 2, display: "grid", gap: `${gap}px`,
    gridTemplateColumns: tabs ? "repeat(2, minmax(0, 1fr))" : workspaceChartGridTracks(columns.sizes),
    gridTemplateRows: tabs ? `repeat(${Math.ceil(panels.length / 2)}, minmax(0, 1fr))` : workspaceChartGridTracks(rows.sizes),
  }}>
    {panels.map(({ id, label }) => <ButtonBase key={id} data-workspace-arrange-slot={id} aria-label={`Move ${label} chart`}
      aria-pressed={selected === id}
      onClick={event => {
        if (ignoreClick.current && event.detail > 0) { ignoreClick.current = false; return; }
        pick(id);
      }}
      onPointerDown={event => startDrag(event, id)} onPointerMove={moveDrag} onPointerUp={endDrag}
      onPointerCancel={cancelDrag} onLostPointerCapture={cancelDrag}
      sx={theme => ({
        minWidth: 0, minHeight: 0, justifyContent: "center", gap: 0.25, touchAction: "none", cursor: "grab",
        border: "1px dashed", borderColor: selected === id ? "primary.main" : "divider",
        bgcolor: tabs ? "background.paper" : alpha(theme.palette.background.paper, selected === id ? 0.66 : 0.28),
        "&:hover, &.Mui-focusVisible": { borderColor: "primary.main" },
        "&:active": { cursor: "grabbing" },
      })}>
      <Box component="span" sx={{ display: "inline-flex", alignItems: "center", bgcolor: "background.paper", px: 1, py: 0.5, fontSize: 13, fontWeight: 700 }}>
        <DragIndicator fontSize="small" />{label}
      </Box>
    </ButtonBase>)}
    {!tabs && (["column", "row"] as const).flatMap(axis => {
      const tracks = axis === "column" ? columns : rows;
      return tracks.sizes.slice(1).map((_, boundary) => divider(axis, tracks, boundary));
    })}
  </Box>;
}
