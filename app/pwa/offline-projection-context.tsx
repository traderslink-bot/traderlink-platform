"use client";

import { createContext, useContext, type ReactNode } from "react";

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

const inflightReads = new Map<string, InflightProjectionContextRead>();

function requestKey(
  pathname: string,
  scope: OfflineProjectionRequestScope,
): string {
  return `${scope.offlineScopeRef}:${scope.accountSelectionRef ?? "none"}:${pathname}`;
}

function beginProjectionContextRead(
  pathname: string,
  scope: OfflineProjectionRequestScope,
): ProjectionContextReadLease {
  const key = requestKey(pathname, scope);
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
      ).then(async (response) =>
        response.ok ? await response.json() as OfflineProjectionContext : null,
      ).catch(() => null).finally(() => {
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

type IdleCapableWindow = Window & Readonly<{
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
  let cancelled = false;
  let idleHandle: number | null = null;
  let read: ProjectionContextReadLease | null = null;
  const idleWindow = window as IdleCapableWindow;
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
    if (idleWindow.requestIdleCallback) {
      idleHandle = idleWindow.requestIdleCallback(run);
      return;
    }
    idleHandle = window.setTimeout(run, 800);
  }, 1_000);
  return () => {
    cancelled = true;
    window.clearTimeout(stableTimer);
    if (idleHandle !== null) {
      if (idleWindow.cancelIdleCallback && idleWindow.requestIdleCallback) {
        idleWindow.cancelIdleCallback(idleHandle);
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
