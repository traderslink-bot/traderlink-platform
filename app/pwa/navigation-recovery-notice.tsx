"use client";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import { useSyncExternalStore } from "react";

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

export function NavigationRecoveryNotice() {
  const path = useSyncExternalStore(subscribe, destination, () => null);
  if (!path) return null;
  return <Alert severity="info" sx={{ mb: 2 }} action={
    <Button color="inherit" href={path}>Try again</Button>
  }>
    The live page could not load. Try again, or use any saved information below.
  </Alert>;
}
