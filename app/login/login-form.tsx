"use client";
import { readLoginResponse } from "@/src/modules/platform/contracts/platform-login-response";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
export type LoginFormMode =
  | "login"
  | "signup"
  | "forgot"
  | "verify"
  | "reset"
  | "link-email"
  | "confirm-email-change";
export function LoginForm({
  mode = "login",
  returnTo = "/workspace",
  googleAvailable = false,
  discordAvailable = false,
  emailAvailable = true,
  initialMessage = "",
  initialError = "",
  reauthenticate = false,
}: {
  mode?: LoginFormMode;
  returnTo?: string;
  googleAvailable?: boolean;
  discordAvailable?: boolean;
  emailAvailable?: boolean;
  initialMessage?: string;
  initialError?: string;
  reauthenticate?: boolean;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [token, setToken] = useState("");
  const [tokenRead, setTokenRead] = useState(false);
  const tokenMode = useRef<LoginFormMode | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(initialError);
  const [message, setMessage] = useState(initialMessage);
  const [confirmationEmail, setConfirmationEmail] = useState("");
  const [needsEmailChangeSignIn, setNeedsEmailChangeSignIn] = useState(false);
  const submitting = useRef(false);
  useEffect(() => {
    if (
      (mode === "verify" ||
        mode === "reset" ||
        mode === "confirm-email-change") &&
      tokenMode.current !== mode
    ) {
      // Strict Mode repeats effects after the first read has cleared the URL.
      tokenMode.current = mode;
      setToken(
        new URLSearchParams(window.location.hash.slice(1)).get("token") ?? "",
      );
      window.history.replaceState(
        null,
        "",
        window.location.pathname + window.location.search,
      );
      setTokenRead(true);
    }
  }, [mode]);
  const signup = mode === "signup" || mode === "link-email";
  const newPassword = signup || mode === "reset";
  const submit = useCallback(async function submit(
    event: FormEvent<HTMLFormElement> | null,
    override?: string,
  ) {
    event?.preventDefault();
    if (submitting.current) return;
    setError("");
    setMessage("");
    setConfirmationEmail("");
    setNeedsEmailChangeSignIn(false);
    if (newPassword && password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    submitting.current = true;
    setBusy(true);
    let navigating = false;
    try {
      const response = await fetch("/api/auth/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: override ?? mode,
          email,
          password,
          name,
          token,
          returnTo,
        }),
      });
      const result = await readLoginResponse(response);
      if (mode === "confirm-email-change" && response.status === 401)
        setNeedsEmailChangeSignIn(true);
      if (!response.ok)
        throw new Error(result.error ?? "Could not complete this request.");
      setPassword("");
      setConfirm("");
      if (result.redirect) {
        window.location.assign(result.redirect);
        navigating = true;
      }
      else { setMessage(result.message); setConfirmationEmail(result.confirmationEmail); }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Try again shortly.");
    } finally {
      if (!navigating) {
        submitting.current = false;
        setBusy(false);
      }
    }
  }, [mode, newPassword, password, confirm, email, name, token, returnTo]);
  const verificationStarted = useRef(false);
  useEffect(() => {
    if (mode === "verify" && tokenRead && token && emailAvailable && !verificationStarted.current) {
      verificationStarted.current = true;
      void submit(null);
    }
  }, [mode, tokenRead, token, emailAvailable, submit]);
  const label = {
    login: "Sign in",
    signup: "Create account",
    forgot: "Send reset email",
    verify: "Verify email",
    reset: "Change password",
    "confirm-email-change": "Confirm new email",
    "link-email": "Add email and password",
  }[mode];
  return (
    <Stack spacing={2}>
      {mode === "login" || mode === "signup" ? (
        <>
          <Button
            variant="outlined"
            href={
              googleAvailable
                ? `/api/auth/google/login?returnTo=${encodeURIComponent(returnTo)}`
                : undefined
            }
            disabled={busy || !googleAvailable}
          >
            Continue with Google
          </Button>
          <Button
            variant="outlined"
            href={
              discordAvailable
                ? `/api/auth/discord/login?returnTo=${encodeURIComponent(returnTo)}${reauthenticate ? "&prompt=consent" : ""}`
                : undefined
            }
            disabled={busy || !discordAvailable}
          >
            Continue with Discord
          </Button>
          <Typography sx={{ textAlign: "center" }} color="text.secondary">
            or use your email
          </Typography>
        </>
      ) : null}
      {error ? (
        <Alert severity="error" role="alert">
          {error}
        </Alert>
      ) : null}
      {needsEmailChangeSignIn ? (
        <Button href="/login?returnTo=%2Faccount%2Flogin" target="_blank" rel="noopener noreferrer">
          Sign in in a new tab, then return here
        </Button>
      ) : null}
      {message ? (
        <Alert severity="success" role="status">
          {confirmationEmail ? <>We sent a confirmation link to <strong>{confirmationEmail}</strong>. Please click the link in that email to verify your account.</> : message}
        </Alert>
      ) : null}
      {tokenRead && !token ? (
        <Alert severity="warning" role="alert">
          This link is missing its verification code. Open the complete link
          from your email, or request a new email from the sign-in page.
        </Alert>
      ) : null}
      {!emailAvailable && mode !== "login" ? (
        <Alert severity="info">
          Email registration and recovery are currently unavailable.
        </Alert>
      ) : null}
      <Box component="form" onSubmit={submit}>
        <Stack spacing={2}>
          {mode === "signup" ? (
            <TextField
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              slotProps={{ inputLabel: { shrink: true }, htmlInput: { maxLength: 120 } }}
              autoComplete="name"
              disabled={busy}
            />
          ) : null}
          {mode !== "verify" &&
          mode !== "reset" &&
          mode !== "confirm-email-change" ? (
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              slotProps={{ inputLabel: { shrink: true }, htmlInput: { maxLength: 254 } }}
              disabled={busy}
            />
          ) : null}
          {mode !== "forgot" && mode !== "verify" && mode !== "confirm-email-change" ? (
            <TextField
              label={mode === "reset" ? "New password" : "Password"}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={newPassword ? "new-password" : "current-password"}
              slotProps={{ inputLabel: { shrink: true } }}
              helperText={
                newPassword
                  ? "Use at least 8 characters."
                  : undefined
              }
              disabled={busy}
            />
          ) : null}
          {newPassword ? (
            <TextField
              label="Confirm password"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              autoComplete="new-password"
              slotProps={{ inputLabel: { shrink: true } }}
              disabled={busy}
            />
          ) : null}
          {mode === "login" ? (
            <Button
              disabled={busy || !email || !password || !emailAvailable}
              onClick={() => void submit(null, "resend")}
            >
              Resend verification email
            </Button>
          ) : null}
          <Button
            type="submit"
            variant="contained"
            disabled={
              busy ||
              (!emailAvailable && mode !== "login") ||
              ((mode === "verify" ||
                mode === "reset" ||
                mode === "confirm-email-change") &&
                !token)
            }
          >
            {busy ? "Please wait…" : label}
          </Button>
        </Stack>
      </Box>
      {mode === "login" ? (
        <>
          <Button href="/login/forgot">Forgot password?</Button>
          <Button
            href={`/login?mode=signup&returnTo=${encodeURIComponent(returnTo)}`}
          >
            Create an account
          </Button>
        </>
      ) : null}
      {mode !== "login" ? (
        <Button href={`/login?returnTo=${encodeURIComponent(returnTo)}`}>
          Back to sign in
        </Button>
      ) : null}
    </Stack>
  );
}
