import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { LoginForm, type LoginFormMode } from "./login-form";
import { googleLoginConfigured } from "@/src/modules/platform/server/authentication/platform-google-oauth";
export function LoginScreen({
  mode,
  returnTo,
  message,
  error,
  reauthenticate = false,
}: {
  mode: LoginFormMode;
  returnTo: string;
  message?: string;
  error?: string;
  reauthenticate?: boolean;
}) {
  const title = {
    login: "Sign in to TradersLink",
    signup: "Create your account",
    forgot: "Reset your password",
    verify: "Verify your email",
    reset: "Choose a new password",
    "confirm-email-change": "Verify your new email",
    "link-email": "Add email and password",
  }[mode];
  return (
    <Box
      component="main"
      sx={{
        minHeight: "80vh",
        display: "grid",
        placeItems: "center",
        px: 2,
        py: 6,
        bgcolor: "background.default",
      }}
    >
      <Paper
        variant="outlined"
        sx={{ width: "100%", maxWidth: 440, p: 3, borderRadius: 2 }}
      >
        <Typography component="h1" variant="h5" sx={{ mb: 3, fontWeight: 700 }}>
          {title}
        </Typography>
        <LoginForm
          mode={mode}
          returnTo={returnTo}
          reauthenticate={reauthenticate}
          googleAvailable={googleLoginConfigured()}
          discordAvailable={Boolean(
            process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET,
          )}
          emailAvailable={Boolean(
            process.env.RESEND_API_KEY &&
              process.env.TRADERLINK_LOGIN_EMAIL_FROM &&
              process.env.TRADERLINK_LOGIN_RATE_LIMIT_SECRET,
          )}
          initialMessage={message}
          initialError={error}
        />
      </Paper>
    </Box>
  );
}
