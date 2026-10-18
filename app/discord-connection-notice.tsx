"use client";
import { readLoginResponse } from "@/src/modules/platform/contracts/platform-login-response";
import { TRADERSLINK_COMMUNITY_INVITE_URL } from "@/src/modules/platform/contracts/discord-community";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

export function DiscordConnectionNotice({ required, connected, joined = false, showJoined = false }: { required: boolean; connected: boolean; joined?: boolean; showJoined?: boolean }) {
  const searchParams = useSearchParams();
  const [dismissed, setDismissed] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");
  async function checkMembership() {
    setChecking(true);
    setError("");
    try {
      const response = await fetch("/api/auth/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "connect", provider: "discord", returnTo: "/workspace" }),
      });
      const result = await readLoginResponse(response);
      if (!response.ok) throw new Error(result.error || "Could not check Discord membership.");
      window.location.assign(result.redirect);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not check Discord membership.");
    } finally {
      setChecking(false);
    }
  }
  if (joined && !showJoined && searchParams.get("connected") !== "discord") return null;
  if (dismissed && (!required || joined)) return null;
  return <Alert severity={joined ? "success" : required ? "warning" : "info"} sx={{ mb: 2, width: { xs: "100%", md: "50%" }, boxSizing: "border-box" }}>
    {joined
      ? "Your Discord account is connected, and you’re already a member of the TradersLink Discord server. Open the server to take part in our trading community, channels and chats."
      : required
      ? connected
        ? "Your Discord account is connected. Join the TradersLink Discord server to use your plan’s Discord channels and chats. Already joined? Select Check membership. You can keep using the app."
        : "Your plan includes Discord benefits. Connect your Discord account to link those benefits, then join the TradersLink Discord server to access its channels and chats. Connecting your account does not join the server. You can keep using the app and finish later."
      : connected
        ? "Your Discord account is connected. Join the TradersLink Discord server to take part in our trading community, channels and chats. Connecting your account does not join the server. You can keep using the app without joining."
        : "Join the TradersLink Discord server to take part in our trading community and chats. Joining the server is separate from connecting a Discord account for sign-in. You can keep using the app without joining."}
    <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap", mt: 1 }}>
      {!connected ? <Button color="inherit" href="/account/login">Connect Discord</Button> : null}
      <Button color="inherit" href={TRADERSLINK_COMMUNITY_INVITE_URL} target="_blank" rel="noopener noreferrer">{joined ? "Open Discord server" : "Join Discord server"}</Button>
      {connected && !joined ? <Button color="inherit" disabled={checking} onClick={checkMembership}>{checking ? "Checking…" : "Check membership"}</Button> : null}
      {!required || joined ? <Button color="inherit" onClick={() => setDismissed(true)}>Later</Button> : null}</Stack>
    {error ? <Stack spacing={1} sx={{ mt: 1 }}>
      <Typography color="error.main" role="status">{error}</Typography>
      <Button color="inherit" href="/login?reauth=1&returnTo=%2Fworkspace">Sign in again</Button>
    </Stack> : null}
  </Alert>;
}
