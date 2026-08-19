"use client";

import { usePathname } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";

import {
  DASHBOARD_HOME_ITEM,
  DASHBOARD_MAIN_NAVIGATION_GROUPS,
  DASHBOARD_STANDALONE_ITEMS,
} from "@/app/dashboard-navigation";
import {
  PLATFORM_OFFLINE_MAX_BLOCKS,
  PLATFORM_OFFLINE_MAX_LINES_PER_BLOCK,
  PLATFORM_OFFLINE_MAX_TOTAL_CHARACTERS,
  PLATFORM_OFFLINE_PROJECTION_CONTRACT_VERSION,
  PLATFORM_OFFLINE_PROJECTION_SCHEMA_VERSION,
  normalizePlatformOfflinePathname,
  platformOfflineRouteCanStoreProjection,
  platformOfflineRouteMode,
  type PlatformOfflineNavigationGroup,
  type PlatformOfflineProjectionBlock,
} from "@/src/modules/platform/contracts/platform-offline-projection-contracts";
import {
  platformOfflinePartitionKey,
  recordPlatformOfflineDeviceState,
  savePlatformOfflineProjection,
} from "@/src/modules/platform/client/pwa/offline-projection-store";

type ProjectionContextResponse = Readonly<{
  accountSelectionRef?: string | null;
  calculationVersion?: string;
  contractVersion?: string;
  generatedAtUtc?: string;
  offlineScopeRef?: string;
  pathname?: string;
  routeMode?: string;
  status?: string;
}>;

const CAPTURE_SELECTOR = "h1,h2,h3,h4,p,li,dt,dd,tr,svg text,[data-pwa-offline-text]";
const EXCLUDED_SELECTOR = "button,a,input,select,textarea,form,script,style,[aria-hidden='true'],[data-pwa-offline-exclude]";

function navigation(): readonly PlatformOfflineNavigationGroup[] {
  const item = (candidate: Readonly<{ href: string; label: string }>) => Object.freeze({
    href: candidate.href,
    label: candidate.label,
    mode: platformOfflineRouteMode(candidate.href),
  });
  return Object.freeze([
    Object.freeze({ label: "Home", items: Object.freeze([item(DASHBOARD_HOME_ITEM)]) }),
    ...DASHBOARD_MAIN_NAVIGATION_GROUPS.map((group) => Object.freeze({
      label: group.label,
      items: Object.freeze(group.items.map(item)),
    })),
    Object.freeze({
      label: "More",
      items: Object.freeze([
        ...DASHBOARD_STANDALONE_ITEMS.map(item),
        Object.freeze({
          href: "/notifications",
          label: "Notifications",
          mode: platformOfflineRouteMode("/notifications"),
        }),
      ]),
    }),
  ]);
}

function cleanText(value: string | null | undefined): string {
  return (value ?? "").replace(/\s+/gu, " ").trim().slice(0, 320);
}

function elementText(element: Element): string {
  const clone = element.cloneNode(true) as Element;
  clone.querySelectorAll(EXCLUDED_SELECTOR).forEach((candidate) => candidate.remove());
  if (clone.matches("tr")) {
    return Array.from(clone.querySelectorAll("th,td"))
      .map((cell) => cleanText(cell.textContent))
      .filter(Boolean)
      .join(" · ");
  }
  return cleanText(clone.textContent);
}

function visible(element: Element): boolean {
  const html = element as HTMLElement;
  const style = window.getComputedStyle(html);
  return style.display !== "none" && style.visibility !== "hidden";
}

function projectionBlocks(root: HTMLElement): Readonly<{
  blocks: readonly PlatformOfflineProjectionBlock[];
  title: string;
  unavailableLineCount: number;
}> {
  const elements = Array.from(root.querySelectorAll(CAPTURE_SELECTOR));
  const blocks: Array<{ heading: string | null; lines: string[] }> = [];
  let title = "Saved TraderLink page";
  let current: { heading: string | null; lines: string[] } = { heading: null, lines: [] };
  let characters = 0;
  let unavailableLineCount = 0;
  const flush = () => {
    if ((current.heading || current.lines.length > 0) && blocks.length < PLATFORM_OFFLINE_MAX_BLOCKS) {
      blocks.push(current);
    }
    current = { heading: null, lines: [] };
  };

  for (const element of elements) {
    if (!visible(element) || element.closest(EXCLUDED_SELECTOR)) continue;
    if (element.matches("th,td") && element.closest("tr")) continue;
    const value = elementText(element);
    if (!value || characters + value.length > PLATFORM_OFFLINE_MAX_TOTAL_CHARACTERS) break;
    const tagName = element.tagName.toLowerCase();
    if (tagName === "h1") {
      title = value;
      continue;
    }
    if (/^h[2-4]$/u.test(tagName)) {
      flush();
      current.heading = value;
      characters += value.length;
      continue;
    }
    if (current.lines.length >= PLATFORM_OFFLINE_MAX_LINES_PER_BLOCK) {
      flush();
    }
    if (current.lines[current.lines.length - 1] === value) continue;
    current.lines.push(value);
    characters += value.length;
    if (/\b(unavailable|excluded|not available|cannot be calculated)\b/iu.test(value)) {
      unavailableLineCount += 1;
    }
  }
  flush();
  return Object.freeze({
    blocks: Object.freeze(blocks.map((block) => Object.freeze({
      heading: block.heading,
      lines: Object.freeze(block.lines),
    }))),
    title,
    unavailableLineCount,
  });
}

async function readContext(pathname: string): Promise<ProjectionContextResponse | null> {
  try {
    const response = await fetch(
      `/api/platform/pwa/projection-context?path=${encodeURIComponent(pathname)}`,
      { cache: "no-store", credentials: "same-origin" },
    );
    return response.ok ? await response.json() as ProjectionContextResponse : null;
  } catch {
    return null;
  }
}

export function OfflineProjectionCapture({
  accountCurrency,
  accountSelectionRef,
  accountTimezone,
  children,
  offlineScopeRef,
}: {
  accountCurrency: string | null;
  accountSelectionRef: string | null;
  accountTimezone: string | null;
  children: ReactNode;
  offlineScopeRef: string;
}) {
  const pathname = normalizePlatformOfflinePathname(usePathname());
  const rootRef = useRef<HTMLDivElement>(null);
  const navigationSnapshot = useMemo(() => navigation(), []);
  const partitionKey = useMemo(
    () => platformOfflinePartitionKey(offlineScopeRef, accountSelectionRef),
    [accountSelectionRef, offlineScopeRef],
  );

  useEffect(() => {
    void recordPlatformOfflineDeviceState(Object.freeze({
      accountCurrency,
      accountSelectionRef,
      accountTimezone,
      key: "current" as const,
      navigation: navigationSnapshot,
      offlineScopeRef,
      partitionKey,
      updatedAtUtc: new Date().toISOString(),
      version: 2 as const,
    }));
  }, [accountCurrency, accountSelectionRef, accountTimezone, navigationSnapshot, offlineScopeRef, partitionKey]);

  const capture = useCallback(async () => {
    const root = rootRef.current;
    if (!root || !navigator.onLine || !platformOfflineRouteCanStoreProjection(pathname)) return;
    const context = await readContext(pathname);
    if (
      context?.status !== "ready" ||
      context.contractVersion !== PLATFORM_OFFLINE_PROJECTION_CONTRACT_VERSION ||
      context.offlineScopeRef !== offlineScopeRef ||
      context.accountSelectionRef !== accountSelectionRef ||
      context.pathname !== pathname ||
      (context.routeMode !== "full_offline_entry" && context.routeMode !== "last_synced") ||
      typeof context.generatedAtUtc !== "string" ||
      typeof context.calculationVersion !== "string"
    ) {
      return;
    }
    const content = projectionBlocks(root);
    if (content.blocks.length === 0) return;
    const lastSyncedAtUtc = new Date().toISOString();
    await savePlatformOfflineProjection(Object.freeze({
      accountSelectionRef,
      blocks: content.blocks,
      calculationVersion: context.calculationVersion,
      contractVersion: PLATFORM_OFFLINE_PROJECTION_CONTRACT_VERSION,
      coverage: Object.freeze({ unavailableLineCount: content.unavailableLineCount }),
      generatedAtUtc: context.generatedAtUtc,
      lastSyncedAtUtc,
      offlineScopeRef,
      partitionKey,
      pathname,
      ref: `${partitionKey}:${pathname}`,
      routeMode: context.routeMode,
      schemaVersion: PLATFORM_OFFLINE_PROJECTION_SCHEMA_VERSION,
      title: content.title,
    }));
  }, [accountSelectionRef, offlineScopeRef, partitionKey, pathname]);

  useEffect(() => {
    let timer = window.setTimeout(() => void capture(), 700);
    const observer = new MutationObserver(() => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => void capture(), 700);
    });
    if (rootRef.current) observer.observe(rootRef.current, { childList: true, subtree: true });
    const refresh = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => void capture(), 0);
    };
    window.addEventListener("online", refresh);
    window.addEventListener("traderlink:pwa-refresh-projection", refresh);
    return () => {
      window.clearTimeout(timer);
      observer.disconnect();
      window.removeEventListener("online", refresh);
      window.removeEventListener("traderlink:pwa-refresh-projection", refresh);
    };
  }, [capture]);

  return (
    <div data-pwa-projection-source ref={rootRef} style={{ display: "contents" }}>
      {children}
    </div>
  );
}
