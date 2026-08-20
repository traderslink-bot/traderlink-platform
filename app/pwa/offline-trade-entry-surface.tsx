"use client";

import CloudOffRoundedIcon from "@mui/icons-material/CloudOffRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import { ManualExecutionEntry } from "../(dashboard)/trade-tracker/manual-execution-entry";
import { DashboardPage } from "../dashboard-ui";
import { OfflineWorkspaceSurface } from "./offline-workspace-surface";
import {
  normalizePlatformOfflinePathname,
  type PlatformOfflineDeviceState,
} from "@/src/modules/platform/contracts/platform-offline-projection-contracts";
import {
  PLATFORM_OFFLINE_DATA_CHANGED_EVENT,
  readPlatformOfflineDeviceState,
} from "@/src/modules/platform/client/pwa/offline-projection-store";
import { syncManualTradeOutbox } from "@/src/modules/platform/client/pwa/manual-trade-outbox";
import type { JournalManualTrackerKind } from "@/src/modules/journal/contracts/journal-manual-trade-capture-contracts";

const OPAQUE_REF_PATTERN = /^[0-9a-f]{64}$/u;

type ReadyOfflineDeviceState = PlatformOfflineDeviceState & Readonly<{
  accountCurrency: string;
  accountSelectionRef: string;
  accountTimezone: string;
}>;

function subscribeToLocation(onStoreChange: () => void): () => void {
  window.addEventListener("popstate", onStoreChange);
  return () => window.removeEventListener("popstate", onStoreChange);
}

function browserPathnameSnapshot(): string {
  return normalizePlatformOfflinePathname(window.location.pathname);
}

function serverPathnameSnapshot(): string {
  return "/offline";
}

function trackerForPathname(pathname: string): JournalManualTrackerKind | null {
  if (pathname === "/quick-trade-entry") return "quick";
  if (pathname === "/trade-tracker/swings") return "swing";
  if (pathname === "/trade-tracker") return "day";
  return null;
}

function trackerTitle(tracker: JournalManualTrackerKind): string {
  if (tracker === "quick") return "Quick Trade Entry";
  if (tracker === "swing") return "Swing Trade Tracker";
  return "Daily Trade Tracker";
}

function readyOfflineDeviceState(
  state: PlatformOfflineDeviceState | null,
): state is ReadyOfflineDeviceState {
  if (
    state?.version !== 2 ||
    !OPAQUE_REF_PATTERN.test(state.offlineScopeRef) ||
    !OPAQUE_REF_PATTERN.test(state.accountSelectionRef ?? "") ||
    state.partitionKey !==
      `${state.offlineScopeRef}:${state.accountSelectionRef}` ||
    !/^[A-Z]{3}$/u.test(state.accountCurrency ?? "") ||
    typeof state.accountTimezone !== "string" ||
    state.accountTimezone.length > 64
  ) {
    return false;
  }
  try {
    new Intl.DateTimeFormat("en-US", {
      timeZone: state.accountTimezone,
    }).format(0);
    return true;
  } catch {
    return false;
  }
}

function currentDateInTimezone(timezone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: timezone,
    year: "numeric",
  }).formatToParts(new Date());
  const part = (type: "day" | "month" | "year") =>
    parts.find((candidate) => candidate.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function OfflineUnavailableState({
  reconnectPath,
  tradeEntry,
}: {
  reconnectPath: string;
  tradeEntry: boolean;
}) {
  return (
    <Stack
      aria-labelledby="offline-access-title"
      role="status"
      sx={{
        alignItems: "center",
        borderColor: "divider",
        borderTop: 1,
        justifyContent: "center",
        minHeight: { xs: 360, sm: 440 },
        px: 2,
        py: 5,
        textAlign: "center",
      }}
    >
      <Box
        sx={{
          alignItems: "center",
          bgcolor: "rgba(1, 30, 86, 0.06)",
          borderRadius: "50%",
          color: "primary.main",
          display: "flex",
          height: 64,
          justifyContent: "center",
          width: 64,
        }}
      >
        <CloudOffRoundedIcon sx={{ fontSize: 32 }} />
      </Box>
      <Typography
        id="offline-access-title"
        sx={{ fontWeight: 760, mt: 2 }}
        variant="h2"
      >
        {tradeEntry
          ? "Reconnect once to enable offline trade entry"
          : "Connect to load live information"}
      </Typography>
      <Typography color="text.secondary" sx={{ maxWidth: 520, mt: 1 }}>
        {tradeEntry
          ? "Open this Trade Tracker account online once so TraderLink can securely prepare offline entry on this device."
          : "Your TraderLink navigation is still available. Saved pages appear in their normal locations when they are available on this device."}
      </Typography>
      <Button href={reconnectPath} sx={{ mt: 3 }} variant="contained">
        Try again
      </Button>
    </Stack>
  );
}

function OfflineTradeOutboxSync({ state }: { state: ReadyOfflineDeviceState }) {
  const syncing = useRef(false);
  const runSync = useCallback(async () => {
    if (!navigator.onLine || syncing.current) return;
    syncing.current = true;
    try {
      await syncManualTradeOutbox({
        accountSelectionRef: state.accountSelectionRef,
        offlineScopeRef: state.offlineScopeRef,
      });
    } finally {
      syncing.current = false;
    }
  }, [state.accountSelectionRef, state.offlineScopeRef]);

  useEffect(() => {
    const onReconnect = () => void runSync();
    const onResume = () => {
      if (document.visibilityState === "visible") void runSync();
    };
    if (navigator.onLine) void runSync();
    window.addEventListener("online", onReconnect);
    window.addEventListener("focus", onResume);
    document.addEventListener("visibilitychange", onResume);
    return () => {
      window.removeEventListener("online", onReconnect);
      window.removeEventListener("focus", onResume);
      document.removeEventListener("visibilitychange", onResume);
    };
  }, [runSync]);

  return null;
}

export function OfflineRouteContent() {
  const pathname = useSyncExternalStore(
    subscribeToLocation,
    browserPathnameSnapshot,
    serverPathnameSnapshot,
  );
  const tracker = trackerForPathname(pathname);
  const [deviceState, setDeviceState] =
    useState<PlatformOfflineDeviceState | null>(null);
  const [stateLoaded, setStateLoaded] = useState(false);

  const refreshDeviceState = useCallback(async () => {
    try {
      setDeviceState(await readPlatformOfflineDeviceState());
    } catch {
      setDeviceState(null);
    } finally {
      setStateLoaded(true);
    }
  }, []);

  useEffect(() => {
    const initialRefresh = window.setTimeout(() => void refreshDeviceState(), 0);
    const onChanged = () => void refreshDeviceState();
    window.addEventListener(PLATFORM_OFFLINE_DATA_CHANGED_EVENT, onChanged);
    return () => {
      window.clearTimeout(initialRefresh);
      window.removeEventListener(PLATFORM_OFFLINE_DATA_CHANGED_EVENT, onChanged);
    };
  }, [refreshDeviceState]);

  if (
    pathname === "/workspace" &&
    stateLoaded &&
    readyOfflineDeviceState(deviceState)
  ) {
    return (
      <>
        <OfflineWorkspaceSurface partitionKey={deviceState.partitionKey} />
        <OfflineTradeOutboxSync state={deviceState} />
      </>
    );
  }

  if (tracker && stateLoaded && readyOfflineDeviceState(deviceState)) {
    return (
      <>
        <DashboardPage>
          <Typography component="h1" variant="h1">
            {trackerTitle(tracker)}
          </Typography>
          <ManualExecutionEntry
            accountCurrency={deviceState.accountCurrency}
            accountTimezone={deviceState.accountTimezone}
            defaultSessionDate={currentDateInTimezone(
              deviceState.accountTimezone,
            )}
            expectedAccountSelectionRef={deviceState.accountSelectionRef}
            offlineScopeRef={deviceState.offlineScopeRef}
            tracker={tracker}
          />
        </DashboardPage>
        <OfflineTradeOutboxSync state={deviceState} />
      </>
    );
  }

  return (
    <DashboardPage>
      <Typography component="h1" variant="h1">
        {tracker ? trackerTitle(tracker) : "Offline access"}
      </Typography>
      {stateLoaded ? (
        <OfflineUnavailableState
          reconnectPath={tracker ? pathname : "/workspace"}
          tradeEntry={tracker !== null}
        />
      ) : null}
    </DashboardPage>
  );
}
