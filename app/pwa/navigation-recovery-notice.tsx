"use client";

import { PLATFORM_ENTRY_PATH } from "@/src/modules/platform/contracts/platform-home-page";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { isDashboardSignInNavigation } from "./dashboard-sign-in-navigation";

function subscribe(listener: () => void): () => void {
  window.addEventListener("popstate", listener);
  return () => window.removeEventListener("popstate", listener);
}

function destination(): string | null {
  const query = new URLSearchParams(window.location.search);
  if (window.location.pathname !== "/offline" || query.get("recovery") !== "navigation") return null;
  const candidate = query.get("path");
  if (!candidate || candidate.length > 512 || !candidate.startsWith("/") ||
    candidate.startsWith("//") || candidate.includes("\\") || candidate.includes("://") ||
    /[\u0000-\u001f\u007f]/u.test(candidate)) return "/workspace";
  const url = new URL(candidate, window.location.origin);
  return url.origin === window.location.origin && url.pathname !== "/offline"
    ? url.pathname + url.search : "/workspace";
}

export function NavigationRecoveryNotice({ children }: { children: ReactNode }) {
  const path = useSyncExternalStore(subscribe, destination, () => null);
  const recoveredUrl = path ? new URL(path, window.location.origin) : null;
  const signInRecovery = recoveredUrl !== null && isDashboardSignInNavigation(recoveredUrl);
  const alreadyRetried = recoveredUrl?.searchParams.get("workspaceRetry") === "1";
  if (signInRecovery) recoveredUrl.searchParams.set("workspaceRetry", "1");
  const retryPath = signInRecovery ? recoveredUrl.pathname + recoveredUrl.search : path;

  useEffect(() => {
    if (!signInRecovery || alreadyRetried || !retryPath || !navigator.onLine) return;
    const timer = window.setTimeout(() => window.location.replace(retryPath), 750);
    return () => window.clearTimeout(timer);
  }, [alreadyRetried, retryPath, signInRecovery]);

  return <>
    {retryPath && <Alert severity="info" role="status" sx={{ mb: 2 }} action={
      <Button color="inherit" href={retryPath}>Try again</Button>
    }>
      {signInRecovery
        ? recoveredUrl.pathname === PLATFORM_ENTRY_PATH
          ? "You’re signed in. Your home page is taking longer than expected to load."
          : "You’re signed in. Workspace is taking longer than expected to load."
        : "The live page could not load. Try again, or use any saved information below."}
    </Alert>}
    {!signInRecovery && children}
  </>;
}
