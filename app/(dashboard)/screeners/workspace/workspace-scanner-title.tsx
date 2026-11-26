"use client";

import { createContext, useContext, type ReactNode } from "react";
import Stack from "@mui/material/Stack";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import ListSubheader from "@mui/material/ListSubheader";
import { livePresetChoices } from "@/src/modules/scanner/custom/built-in-scans";
import { SAVED_SCAN_ID, type SavedScanCatalogue } from "@/src/modules/scanner/custom/definition";
import { extraWidgets, widgetNames } from "./scanner-desktop-layout";
import type { ExtraWorkspaceCard } from "../scanner-workspace-layout";
import { GAINER_CARD_LABELS } from "@/src/modules/scanner/live/gainer-card-policy";

type LivePreset = (typeof livePresetChoices)[number];
type LivePresetId = LivePreset["id"];
type LivePresetWidget = LivePreset["widget"];
export const scannerCardSlots = Object.fromEntries(
  livePresetChoices.map(({ widget, label }) => [widget, label]),
) as Record<LivePresetWidget, string>;
const gainerSessionViews = ["day-gainers", "post-market-gainers"] as const;
type GainerSessionView = (typeof gainerSessionViews)[number];
type WorkspaceScannerChoice = LivePresetId | GainerSessionView;
const presetById = new Map<string, LivePreset>(livePresetChoices.map(preset => [preset.id, preset]));
const presetByWidget = new Map<string, LivePreset>(livePresetChoices.map(preset => [preset.widget, preset]));

export function readScannerChoice(value: string): WorkspaceScannerChoice | undefined {
  if (value === "day-gainers" || value === "post-market-gainers") return value;
  return (presetById.get(value) ?? presetByWidget.get(value))?.id;
}

export function workspaceScannerKind(slot: ScannerCardSlot, choice?: WorkspaceScannerChoice): ScannerCardKind {
  if (choice === "day-gainers" || choice === "post-market-gainers") return choice;
  return (choice && presetById.get(choice)?.widget) || defaultScannerForSlot(slot);
}
export const scannerTitles = {
  ...scannerCardSlots,
  ...GAINER_CARD_LABELS,
};
export type BaseScannerCardSlot = keyof typeof scannerCardSlots;
export type ScannerCardSlot = BaseScannerCardSlot | ExtraWorkspaceCard;
export const scannerSlots = [...Object.keys(scannerCardSlots) as BaseScannerCardSlot[], ...extraWidgets];
export const defaultScannerForSlot = (slot: ScannerCardSlot): BaseScannerCardSlot =>
  slot === "scanner-8" ? "gainers" : slot === "scanner-9" ? "momentum" : slot;
export type ScannerCardKind = keyof typeof scannerTitles;
export type CardScanners = Partial<Record<ScannerCardSlot, WorkspaceScannerChoice>>;
export type CardSavedScanIds = Partial<Record<ScannerCardSlot, string>>;
export function readCardSavedScanIds(value: unknown): CardSavedScanIds {
  if (!value || typeof value !== "object") return {};
  return Object.fromEntries(Object.entries(value).filter(([slot, id]) =>
    isScannerCardSlot(slot) && typeof id === "string" && SAVED_SCAN_ID.test(id)));
}
export const isScannerCardSlot = (value: string): value is ScannerCardSlot => Object.hasOwn(scannerCardSlots, value) || extraWidgets.some(slot => slot === value);
export const isScannerCard = (value: string): value is ScannerCardKind => Object.hasOwn(scannerTitles,value);
export function readCardScanners(value: unknown): CardScanners {
  if (!value || typeof value !== "object") return {};
  const selections: CardScanners = {};
  for (const [slot, scanner] of Object.entries(value)) {
    if (!isScannerCardSlot(slot) || typeof scanner !== "string") continue;
    const choice = readScannerChoice(scanner);
    if (choice) selections[slot] = choice;
  }
  return selections;
}

export const WorkspaceScannerTitleContext = createContext<{
  slot: ScannerCardSlot;
  scanner: ScannerCardKind;
  savedScanId?: string;
  savedLabel?: string;
  savedScans?: SavedScanCatalogue["scans"];
  onChange: (scanner: WorkspaceScannerChoice) => void;
  onSelectSavedScan: (id: string) => void;
  onOpen?: () => void;
}|null>(null);

export function WorkspaceScannerCardHeader({ children }: { children: ReactNode }) {
  return <Stack data-workspace-scanner-header direction="row"
    sx={{ alignItems: "center", justifyContent: "space-between", gap: 0.5, mb: 0.5, minHeight: 22 }}>
    {children}
  </Stack>;
}

export const workspaceScannerTableHeaderSx = {
  color: "text.secondary",
  fontSize: "0.6rem",
  fontWeight: 750,
  lineHeight: 1,
  pt: 0.34,
  pb: 0.7,
  whiteSpace: "nowrap",
} as const;

export function WorkspaceScannerTitle({ children, label }: { children?:ReactNode; label?:string }) {
  const choice=useContext(WorkspaceScannerTitleContext);
  if(!choice)return children;
  const value = choice.savedScanId ? `saved:${choice.savedScanId}` : readScannerChoice(choice.scanner) ?? "";
  const missing = choice.savedScanId && !choice.savedScans?.some(scan => scan.id === choice.savedScanId);
  return <Select value={value} variant="standard" disableUnderline autoWidth
    onOpen={choice.onOpen}
    renderValue={() => choice.savedLabel ?? label ?? scannerTitles[choice.scanner]}
    inputProps={{"aria-label":`Scanner for ${widgetNames[choice.slot]} card`}}
    onChange={event=>{
      const selected = event.target.value;
      if (selected.startsWith("saved:")) choice.onSelectSavedScan(selected.slice(6));
      else {
        const scanner = readScannerChoice(selected);
        if (scanner) choice.onChange(scanner);
      }
    }}
    sx={{minWidth:0,width:"fit-content",maxWidth:"100%",fontSize:"0.9rem",fontWeight:850,
      "& .MuiSelect-select":{py:0,pl:0,pr:"24px !important",minWidth:"0 !important",textOverflow:"ellipsis"},
      "& .MuiSelect-icon":{fontSize:20,right:0}}}>
    {/* The trigger fits the current title; the menu fits its full, unwrapped choices. */}
    {livePresetChoices.map(({ id, label })=><MenuItem key={id} value={id} sx={{whiteSpace:"nowrap"}}>{label}</MenuItem>)}
    <ListSubheader>Top Gainers sessions</ListSubheader>
    {gainerSessionViews.map(view=><MenuItem key={view} value={view} sx={{whiteSpace:"nowrap"}}>{scannerTitles[view]}</MenuItem>)}
    {choice.savedScans?.length ? <ListSubheader>Saved scans</ListSubheader> : null}
    {choice.savedScans?.map(scan => <MenuItem key={scan.id} value={`saved:${scan.id}`} sx={{whiteSpace:"nowrap"}}>{scan.name}</MenuItem>)}
    {missing ? <MenuItem value={value} disabled>{choice.savedLabel}</MenuItem> : null}
  </Select>;
}
