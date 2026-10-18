"use client";
import { readLoginResponse } from "@/src/modules/platform/contracts/platform-login-response";
import type { LoginMethodDetails } from "@/src/modules/platform/contracts/platform-login-method-details";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { LoginForm } from "@/app/login/login-form";
export function ConnectedMethods({
  details,
  googleAvailable,
  discordAvailable,
  emailAvailable,
}: {
  details: LoginMethodDetails;
  googleAvailable: boolean;
  discordAvailable: boolean;
  emailAvailable: boolean;
}) {
  const router = useRouter();
  const [disconnectedProviders, setDisconnectedProviders] = useState<string[]>([]);
  const connectedProviders = details.providers.filter(method => method.connected && !disconnectedProviders.includes(method.provider)).map(method => method.provider);
  const [noticeProvider, setNoticeProvider] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState<string | null>(null);
  async function update(action: string, provider: string) {
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/auth/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, provider }),
      });
      const result = await readLoginResponse(r);
      if (!r.ok) throw new Error(result.error);
      if (action === "unlink") {
        setDisconnectedProviders(current => [...current, provider]);
        setConfirm(null);
        setNoticeProvider(provider);
        setNotice(`${provider === "email" ? "Email and password" : provider === "google" ? "Google" : "Discord"} disconnected. You can sign in with your other connected method.`);
        router.refresh();
        return;
      }
      window.location.assign(result.redirect);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not update your login methods.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <Stack spacing={2}>
      {notice && !noticeProvider ? (
        <Alert severity="success" role="status">
          {notice}
        </Alert>
      ) : null}
      {error ? (
        <Alert severity="error" role="alert">
          {error}
        </Alert>
      ) : null}
      <Typography>
        Connect another method to sign in to this same account. Discord is
        optional for app login and is needed for Discord plan benefits.
      </Typography>
      <Button onClick={() => router.refresh()} disabled={busy}>Refresh connection status</Button>
      {(
        [
          ["google", "Google", googleAvailable],
          ["discord", "Discord", discordAvailable],
          ["email", "Email and password", emailAvailable],
        ] as const
      ).map(([provider, label, available]) => (
        <Stack key={provider} spacing={1} sx={{ border: 1, borderColor: "divider", borderRadius: 1, p: 2, minWidth: 0, overflowWrap: "anywhere" }}>
          <Typography sx={{ fontWeight: 700 }}>
            {label}:{" "}
            {connectedProviders.includes(provider) ? "Connected" : "Not connected"}
          </Typography>
          {provider === "email" ? (
            <>
              <Typography variant="body2">Email address: {details.email.address ?? "Not set up"}</Typography>
              <Typography variant="body2">
                {details.email.address
                  ? details.email.verified ? "Verification: Verified" : "Verification: Not verified — check your inbox for a verification link."
                  : "Verification: No email address to verify"}
              </Typography>
              {details.email.address && !connectedProviders.includes("email") && details.email.verified ? (
                <Typography variant="body2">Email and password are disconnected. This address cannot sign in until reconnected.</Typography>
              ) : null}
              {details.email.pendingAddress ? (
                <Alert severity="info">Awaiting verification: {details.email.pendingAddress}. Your current email stays {details.email.address} until the new address is verified.</Alert>
              ) : null}
            </>
          ) : connectedProviders.includes(provider) ? (
            <>
              <Typography variant="body2">
                Account: {details.providers.find(method => method.provider === provider)?.accountName ?? "Account details will appear after your next sign-in with this provider."}
              </Typography>
              {details.providers.find(method => method.provider === provider)?.email ? (
                <Typography variant="body2">Verified provider email: {details.providers.find(method => method.provider === provider)?.email}</Typography>
              ) : <Typography variant="body2">No verified provider email is available.</Typography>}
            </>
          ) : null}
          {connectedProviders.includes(provider) && details.signedInWith === provider ? <Typography variant="body2">Used for this sign-in</Typography> : null}
          {connectedProviders.includes(provider) && connectedProviders.length === 1 ? <Typography variant="body2">Your only connected login method. Connect another before disconnecting this one.</Typography> : null}
          {connectedProviders.includes(provider) ? (
            <Button
              disabled={busy || connectedProviders.length === 1}
              onClick={() => setConfirm(provider)}
            >
              Disconnect {label}
            </Button>
          ) : provider !== "email" ? (
            <Button
              variant="outlined"
              disabled={busy || !available}
              onClick={() => update("connect", provider)}
            >
              Connect {label}
            </Button>
          ) : (
            <>
              <Typography variant="body2">
                Use your existing email and password to reconnect, or verify a
                new email login.
              </Typography>
              <LoginForm mode="link-email" emailAvailable={emailAvailable} onComplete={() => router.refresh()} />
            </>
          )}
          {confirm === provider ? (
            <Alert severity="warning" role="alert">
              <Stack spacing={1}>
                <Typography>
                  Disconnect {label}?
                  {provider === "discord"
                    ? " Linked Discord benefits will stop. Your Journal and purchased app access stay with your account."
                    : " You can use your other connected method to sign in."}
                </Typography>
                <Button disabled={busy} onClick={() => update("unlink", provider)}>
                  Confirm disconnect
                </Button>
                <Button disabled={busy} onClick={() => setConfirm(null)}>Cancel</Button>
              </Stack>
            </Alert>
          ) : null}
          {notice && noticeProvider === provider ? <Alert severity="success" role="status">{notice}</Alert> : null}
        </Stack>
      ))}
      {connectedProviders.includes("email") ? (
        <Stack spacing={1}>
          <Button href="/login/forgot">Change or reset password</Button>
          <Typography variant="h6">Change email login</Typography>
          <TextField
            type="email"
            label="New email address"
            slotProps={{ inputLabel: { shrink: true } }}
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            disabled={busy}
          />
          <Button
            disabled={busy || !emailAvailable || !newEmail}
            onClick={async () => {
              setBusy(true);
              setError("");
              try {
                const response = await fetch("/api/auth/email", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    action: "change-email",
                    email: newEmail,
                  }),
                });
                const result = await readLoginResponse(response);
                if (!response.ok) throw new Error(result.error);
                setNoticeProvider(null);
                setNotice(result.message);
                router.refresh();
              } catch (e) {
                setError(
                  e instanceof Error ? e.message : "Could not change email",
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            Verify new email address
          </Button>
        </Stack>
      ) : null}
    </Stack>
  );
}
