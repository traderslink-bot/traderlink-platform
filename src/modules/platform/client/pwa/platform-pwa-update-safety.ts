"use client";

import { useEffect, useRef } from "react";

export const PWA_UPDATE_SAFETY_CHANGED = "traderlink:update-safety-changed";
const blockers = new Set<symbol>();
let edited = false;
let watching = 0;

function changed(): void {
  // React cleanup/setup and focus transitions must finish before inspecting.
  queueMicrotask(() => window.dispatchEvent(new Event(PWA_UPDATE_SAFETY_CHANGED)));
}

export function usePwaUpdateBlocker(blocked: boolean): void {
  const key = useRef(Symbol("unsaved-work"));
  useEffect(() => {
    const source = key.current;
    if (blocked) blockers.add(source);
    else blockers.delete(source);
    changed();
    return () => { blockers.delete(source); changed(); };
  }, [blocked]);
}

export function canSafelyUpdatePwa(): boolean {
  if (typeof document === "undefined" || watching === 0 || edited || blockers.size) return false;
  // Unknown embedded editors and open dialogs cannot certify their drafts.
  if (document.querySelector('iframe, [role="dialog"], dialog[open]')) return false;
  const active = document.activeElement;
  return !(active instanceof Element && active.closest(
    'input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"], form',
  ));
}

export function watchPwaUpdateSafety(): () => void {
  watching += 1;
  const recordEdit = (event: Event) => {
    if (event.target instanceof Element && event.target.closest("[data-pwa-update-control]")) return;
    // Never infer that a submit/click saved an unknown form successfully. Retain
    // this conservative latch for the document lifetime, including SPA routes.
    edited = true;
    changed();
  };
  const recordFormInteraction = (event: Event) => {
    if (event.target instanceof Element && event.target.closest('form, [role="dialog"], dialog[open]')) {
      recordEdit(event);
    }
  };
  const answerSafetyQuery = (event: MessageEvent) => {
    if (event.data?.type !== "traderlink:update-safety-check" || !event.ports[0]) return;
    event.ports[0].postMessage({ safe: canSafelyUpdatePwa() });
    event.ports[0].close();
  };
  for (const name of ["beforeinput", "input", "change", "compositionstart", "drop"]) {
    document.addEventListener(name, recordEdit, true);
  }
  document.addEventListener("pointerdown", recordFormInteraction, true);
  document.addEventListener("focusin", changed);
  document.addEventListener("focusout", changed);
  navigator.serviceWorker.addEventListener("message", answerSafetyQuery);
  return () => {
    watching -= 1;
    for (const name of ["beforeinput", "input", "change", "compositionstart", "drop"]) {
      document.removeEventListener(name, recordEdit, true);
    }
    document.removeEventListener("pointerdown", recordFormInteraction, true);
    document.removeEventListener("focusin", changed);
    document.removeEventListener("focusout", changed);
    navigator.serviceWorker.removeEventListener("message", answerSafetyQuery);
  };
}
