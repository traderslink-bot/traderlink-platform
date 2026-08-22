"use client";

import "client-only";

export type InstallPromptChoice = Readonly<{
  outcome: "accepted" | "dismissed";
}>;

type DeferredInstallPrompt = Event & {
  prompt: () => Promise<InstallPromptChoice>;
};

type InstalledRelatedApplication = Readonly<{
  id?: string;
  platform: string;
}>;

type NavigatorWithInstalledRelatedApps = Navigator & {
  getInstalledRelatedApps?: () => Promise<readonly InstalledRelatedApplication[]>;
};

let deferredPrompt: DeferredInstallPrompt | null = null;
let promptCaptureStarted = false;
const promptListeners = new Set<() => void>();

function notifyPromptListeners(): void {
  promptListeners.forEach((listener) => listener());
}

export function startTradersLinkPwaInstallPromptCapture(): void {
  if (typeof window === "undefined" || promptCaptureStarted) return;
  promptCaptureStarted = true;

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event as DeferredInstallPrompt;
    notifyPromptListeners();
  });
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    notifyPromptListeners();
  });
}

export function subscribeToTradersLinkPwaInstallPrompt(
  onStoreChange: () => void,
): () => void {
  startTradersLinkPwaInstallPromptCapture();
  promptListeners.add(onStoreChange);
  return () => promptListeners.delete(onStoreChange);
}

export function tradersLinkPwaInstallPromptReady(): boolean {
  return deferredPrompt !== null;
}

export function serverTradersLinkPwaInstallPromptReady(): boolean {
  return false;
}

export async function requestTradersLinkPwaInstallation(): Promise<InstallPromptChoice | null> {
  const prompt = deferredPrompt;
  if (!prompt) return null;

  deferredPrompt = null;
  notifyPromptListeners();
  try {
    return await prompt.prompt();
  } catch {
    return null;
  }
}

export function isTradersLinkPwaRunningStandalone(): boolean {
  const iosNavigator = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches ||
    iosNavigator.standalone === true;
}

export function isIosDevice(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

export async function hasInstalledTradersLinkPwa(): Promise<boolean> {
  const browserNavigator = navigator as NavigatorWithInstalledRelatedApps;
  if (!browserNavigator.getInstalledRelatedApps) return false;
  const relatedApps = await browserNavigator.getInstalledRelatedApps();
  const absoluteManifestId = new URL("/workspace", window.location.origin).href;
  return relatedApps.some((app) => app.platform === "webapp" &&
    (app.id === "/workspace" || app.id === absoluteManifestId));
}

if (typeof window !== "undefined") {
  startTradersLinkPwaInstallPromptCapture();
}
