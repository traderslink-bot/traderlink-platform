"use client";
import { readLoginResponse } from "@/src/modules/platform/contracts/platform-login-response";
import { useState } from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { LoginForm } from "@/app/login/login-form";
export function ConnectedMethods({
  methods,
  googleAvailable,
  discordAvailable,
  emailAvailable,
}: {
  methods: string[];
  googleAvailable: boolean;
  discordAvailable: boolean;
  emailAvailable: boolean;
}) {
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
      {notice ? (
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
      {(
        [
          ["google", "Google", googleAvailable],
          ["discord", "Discord", discordAvailable],
          ["email", "Email and password", emailAvailable],
        ] as const
      ).map(([provider, label, available]) => (
        <Stack key={provider} spacing={1}>
          <Typography sx={{ fontWeight: 700 }}>
            {label}:{" "}
            {methods.includes(provider) ? "Connected" : "Not connected"}
          </Typography>
          {methods.includes(provider) ? (
            <Button
              disabled={busy || methods.length === 1}
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
              <LoginForm mode="link-email" emailAvailable={emailAvailable} />
            </>
          )}
        </Stack>
      ))}
      {methods.includes("email") ? (
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
                setNotice(result.message);
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
      {confirm ? (
        <Alert severity="warning">
          <Stack spacing={1}>
            <Typography>
              Disconnect {confirm}?
              {confirm === "discord"
                ? " Linked Discord benefits will stop. Your Journal and purchased app access stay with your account."
                : " You can use your other connected method to sign in."}
            </Typography>
            <Button disabled={busy} onClick={() => update("unlink", confirm)}>
              Confirm disconnect
            </Button>
            <Button disabled={busy} onClick={() => setConfirm(null)}>
              Cancel
            </Button>
          </Stack>
        </Alert>
      ) : null}
    </Stack>
  );
}
