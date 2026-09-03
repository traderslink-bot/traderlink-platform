"use client";

import { createContext, useContext, type ReactNode } from "react";

import {
  PLATFORM_OFFLINE_PROJECTION_CONTRACT_VERSION,
  platformOfflineRouteMode,
} from "@/src/modules/platform/contracts/platform-offline-projection-contracts";

export type OfflineProjectionContext = Readonly<{
  accountSelectionRef?: string | null;
  calculationVersion?: string;
  contractVersion?: string;
  generatedAtUtc?: string;
  offlineScopeRef?: string;
  pathname?: string;
  routeMode?: string;
  status?: string;
}>;

export type OfflineProjectionRequestScope = Readonly<{
  accountSelectionRef: string | null;
  offlineScopeRef: string;
}>;

const OfflineProjectionRequestScopeContext =
  createContext<OfflineProjectionRequestScope | null>(null);

type InflightProjectionContextRead = {
  controller: AbortController;
  consumers: number;
  promise: Promise<OfflineProjectionContext | null>;
};

type ProjectionContextReadLease = Readonly<{
  promise: Promise<OfflineProjectionContext | null>;
  release: () => void;
}>;

type CurrentProjectionContext = Readonly<{
  context: OfflineProjectionContext;
  key: string;
  validUntil: number;
}>;

const CURRENT_CONTEXT_REUSE_MS = 60_000;
const inflightReads = new Map<string, InflightProjectionContextRead>();
let currentContext: CurrentProjectionContext | null = null;
let currentRequestKey: string | null = null;

function requestKey(
  pathname: string,
  scope: OfflineProjectionRequestScope,
): string {
  return `${scope.offlineScopeRef}:${scope.accountSelectionRef ?? "none"}:${pathname}`;
}

function contextMatchesRequest(
  context: OfflineProjectionContext,
  pathname: string,
  scope: OfflineProjectionRequestScope,
): boolean {
  return context.status === "ready" &&
    context.contractVersion === PLATFORM_OFFLINE_PROJECTION_CONTRACT_VERSION &&
    context.offlineScopeRef === scope.offlineScopeRef &&
    context.accountSelectionRef === scope.accountSelectionRef &&
    context.pathname === pathname &&
    context.routeMode === platformOfflineRouteMode(pathname) &&
    typeof context.generatedAtUtc === "string" &&
    typeof context.calculationVersion === "string";
}

function beginProjectionContextRead(
  pathname: string,
  scope: OfflineProjectionRequestScope,
): ProjectionContextReadLease {
  const key = requestKey(pathname, scope);
  if (
    currentContext?.key === key &&
    currentContext.validUntil > Date.now()
  ) {
    return Object.freeze({
      promise: Promise.resolve(currentContext.context),
      release: () => undefined,
    });
  }
  currentContext = null;
  let read = inflightReads.get(key);
  if (!read) {
    const controller = new AbortController();
    read = {
      controller,
      consumers: 0,
      promise: fetch(
        `/api/platform/pwa/projection-context?path=${encodeURIComponent(pathname)}`,
        {
          cache: "no-store",
          credentials: "same-origin",
          headers: { accept: "application/json" },
          signal: controller.signal,
        },
      ).then(async (response) => {
        if (!response.ok) return null;
        const context = await response.json() as OfflineProjectionContext;
        if (
          currentRequestKey === key &&
          contextMatchesRequest(context, pathname, scope)
        ) {
          currentContext = Object.freeze({
            context: Object.freeze(context),
            key,
            validUntil: Date.now() + CURRENT_CONTEXT_REUSE_MS,
          });
        }
        return context;
      }).catch(() => null).finally(() => {
        if (inflightReads.get(key) === read) inflightReads.delete(key);
      }),
    };
    inflightReads.set(key, read);
  }
  read.consumers += 1;
  let released = false;
  return Object.freeze({
    promise: read.promise,
    release: () => {
      if (released) return;
      released = true;
      read.consumers -= 1;
      if (read.consumers <= 0 && inflightReads.get(key) === read) {
        read.controller.abort();
        inflightReads.delete(key);
      }
    }
  });
}

type IdleCapableWindow = Readonly<{
  cancelIdleCallback?: (handle: number) => void;
  requestIdleCallback?: (callback: () => void) => number;
}>;

export function scheduleOfflineProjectionContextRead(
  input: Readonly<{
    onContext: (context: OfflineProjectionContext | null) => void;
    pathname: string;
    scope: OfflineProjectionRequestScope;
  }>,
): () => void {
  const key = requestKey(input.pathname, input.scope);
  currentRequestKey = navigator.onLine ? key : null;
  if (!currentRequestKey || currentContext?.key !== key) currentContext = null;
  let cancelled = false;
  let idleHandle: number | null = null;
  let read: ProjectionContextReadLease | null = null;
  const idleWindow = window as unknown as IdleCapableWindow;
  const requestIdleCallback = typeof idleWindow.requestIdleCallback === "function"
    ? idleWindow.requestIdleCallback.bind(idleWindow)
    : null;
  const cancelIdleCallback = typeof idleWindow.cancelIdleCallback === "function"
    ? idleWindow.cancelIdleCallback.bind(idleWindow)
    : null;
  const run = () => {
    if (cancelled || !navigator.onLine) return;
    read = beginProjectionContextRead(input.pathname, input.scope);
    void read.promise.then((context) => {
      if (!cancelled) input.onContext(context);
    }).finally(() => {
      read?.release();
      read = null;
    });
  };
  const stableTimer = window.setTimeout(() => {
    if (requestIdleCallback && cancelIdleCallback) {
      idleHandle = requestIdleCallback(run);
      return;
    }
    idleHandle = window.setTimeout(run, 800);
  }, 1_000);
  return () => {
    cancelled = true;
    window.clearTimeout(stableTimer);
    if (idleHandle !== null) {
      if (requestIdleCallback && cancelIdleCallback) {
        cancelIdleCallback(idleHandle);
      } else {
        window.clearTimeout(idleHandle);
      }
    }
    read?.release();
    read = null;
  };
}

export function OfflineProjectionRequestScopeProvider({
  children,
  scope,
}: Readonly<{
  children: ReactNode;
  scope: OfflineProjectionRequestScope;
}>) {
  return (
    <OfflineProjectionRequestScopeContext.Provider value={scope}>
      {children}
    </OfflineProjectionRequestScopeContext.Provider>
  );
}

export function useOfflineProjectionRequestScope(): OfflineProjectionRequestScope | null {
  return useContext(OfflineProjectionRequestScopeContext);
}
