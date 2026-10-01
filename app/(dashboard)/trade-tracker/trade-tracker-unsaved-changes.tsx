"use client";

import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  PROGRAMMATIC_NAVIGATION_CANCELLED_EVENT,
  PROGRAMMATIC_NAVIGATION_EVENT,
} from "./trade-tracker-navigation-events";

type UnsavedChangesContextValue = Readonly<{
  confirmNavigation: () => boolean;
  dirtySources: ReadonlySet<string>;
  reportUnsavedChanges: (source: string, hasUnsavedChanges: boolean) => void;
}>;

const UnsavedChangesContext = createContext<UnsavedChangesContextValue>({
  confirmNavigation: () => true,
  dirtySources: new Set(),
  reportUnsavedChanges: () => undefined,
});

const LEAVE_PAGE_MESSAGE =
  "You have changes that have not been saved. Leave this page anyway?";
const HISTORY_GUARD_STATE_KEY = "__traderlinkTradeTrackerUnsavedGuard";

export function TradeTrackerUnsavedChangesProvider({
  children,
}: Readonly<{ children: ReactNode }>) {
  const [dirtySources, setDirtySources] = useState<Set<string>>(() => new Set());
  const allowNextUnload = useRef(false);
  const allowNextHistoryNavigation = useRef(false);
  const historyGuardActive = useRef(false);
  const hasUnsavedChanges = dirtySources.size > 0;

  const reportUnsavedChanges = useCallback(
    (source: string, sourceHasUnsavedChanges: boolean) => {
      setDirtySources((current) => {
        const alreadyReported = current.has(source);
        if (alreadyReported === sourceHasUnsavedChanges) return current;
        const next = new Set(current);
        if (sourceHasUnsavedChanges) next.add(source);
        else next.delete(source);
        return next;
      });
    },
    [],
  );

  const confirmNavigation = useCallback(
    () => !hasUnsavedChanges || window.confirm(LEAVE_PAGE_MESSAGE),
    [hasUnsavedChanges],
  );

  useEffect(() => {
    const guardedUrl = window.location.href;

    if (
      hasUnsavedChanges &&
      window.history.state?.[HISTORY_GUARD_STATE_KEY] !== guardedUrl
    ) {
      window.history.pushState(
        {
          ...window.history.state,
          [HISTORY_GUARD_STATE_KEY]: guardedUrl,
        },
        "",
        guardedUrl,
      );
    }
    historyGuardActive.current =
      window.history.state?.[HISTORY_GUARD_STATE_KEY] === guardedUrl;

    function warnBeforeUnload(event: BeforeUnloadEvent): void {
      if (!hasUnsavedChanges) return;
      if (allowNextUnload.current) {
        allowNextUnload.current = false;
        return;
      }
      event.preventDefault();
      event.returnValue = "";
    }

    function warnBeforeProgrammaticNavigation(event: Event): void {
      if (!hasUnsavedChanges) return;
      if (!window.confirm(LEAVE_PAGE_MESSAGE)) {
        event.preventDefault();
        return;
      }
      allowNextUnload.current = true;
    }

    function cancelProgrammaticNavigation(): void {
      allowNextUnload.current = false;
    }

    function warnBeforeHistoryNavigation(event: PopStateEvent): void {
      if (allowNextHistoryNavigation.current) {
        allowNextHistoryNavigation.current = false;
        return;
      }
      if (
        !historyGuardActive.current ||
        event.state?.[HISTORY_GUARD_STATE_KEY] === guardedUrl
      ) return;

      if (hasUnsavedChanges && !window.confirm(LEAVE_PAGE_MESSAGE)) {
        allowNextHistoryNavigation.current = true;
        window.history.forward();
        return;
      }

      historyGuardActive.current = false;
      allowNextHistoryNavigation.current = true;
      allowNextUnload.current = true;
      window.history.back();
    }

    function warnBeforeNavigation(event: MouseEvent): void {
      if (
        !hasUnsavedChanges ||
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) return;
      const source = event.target;
      if (!(source instanceof Element)) return;
      const link = source.closest("a[href]");
      if (
        !(link instanceof HTMLAnchorElement) ||
        link.target ||
        link.hasAttribute("download")
      ) return;
      const destination = new URL(link.href, window.location.href);
      if (
        destination.origin !== window.location.origin ||
        (
          destination.pathname === window.location.pathname &&
          destination.search === window.location.search
        )
      ) return;
      if (!window.confirm(LEAVE_PAGE_MESSAGE)) {
        event.preventDefault();
        event.stopPropagation();
      }
    }

    window.addEventListener("beforeunload", warnBeforeUnload);
    window.addEventListener(PROGRAMMATIC_NAVIGATION_EVENT, warnBeforeProgrammaticNavigation);
    window.addEventListener(PROGRAMMATIC_NAVIGATION_CANCELLED_EVENT, cancelProgrammaticNavigation);
    window.addEventListener("popstate", warnBeforeHistoryNavigation);
    document.addEventListener("click", warnBeforeNavigation, true);
    return () => {
      window.removeEventListener("beforeunload", warnBeforeUnload);
      window.removeEventListener(PROGRAMMATIC_NAVIGATION_EVENT, warnBeforeProgrammaticNavigation);
      window.removeEventListener(PROGRAMMATIC_NAVIGATION_CANCELLED_EVENT, cancelProgrammaticNavigation);
      window.removeEventListener("popstate", warnBeforeHistoryNavigation);
      document.removeEventListener("click", warnBeforeNavigation, true);
    };
  }, [hasUnsavedChanges]);

  const value = useMemo(
    () => ({ confirmNavigation, dirtySources, reportUnsavedChanges }),
    [confirmNavigation, dirtySources, reportUnsavedChanges],
  );

  return (
    <UnsavedChangesContext.Provider value={value}>
      {children}
    </UnsavedChangesContext.Provider>
  );
}

export function useTradeTrackerNavigationGuard(): () => boolean {
  return useContext(UnsavedChangesContext).confirmNavigation;
}

export function useTradeTrackerHasUnsavedChangesExcept(
  ignoredSources: readonly string[],
): boolean {
  const { dirtySources } = useContext(UnsavedChangesContext);
  return [...dirtySources].some((source) => !ignoredSources.includes(source));
}

export function useTradeTrackerUnsavedChanges(
  source: string,
  hasUnsavedChanges: boolean,
): void {
  const { reportUnsavedChanges } = useContext(UnsavedChangesContext);
  useEffect(() => {
    reportUnsavedChanges(source, hasUnsavedChanges);
    return () => reportUnsavedChanges(source, false);
  }, [hasUnsavedChanges, reportUnsavedChanges, source]);
}
