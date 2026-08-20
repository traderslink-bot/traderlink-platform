"use client";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Divider from "@mui/material/Divider";
import FormControlLabel from "@mui/material/FormControlLabel";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useEffect, useState, useTransition } from "react";

import {
  PLATFORM_NOTIFICATION_CATEGORIES,
  type PlatformNotificationCategory,
} from "@/src/modules/platform/contracts/platform-notification-contracts";
import {
  disablePlatformWebPush,
  enablePlatformWebPush,
  preparePlatformWebPush,
  readPlatformWebPushBrowserState,
  type PreparedPlatformWebPush,
  type PlatformWebPushBrowserState,
} from "@/src/modules/platform/client/pwa/platform-web-push";
import {
  saveDiscordDmNotificationCategories,
  saveWebPushNotificationCategories,
} from "./notification-preferences-actions";

const labels: Readonly<Record<PlatformNotificationCategory, string>> = Object.freeze({
  ai_review: "AI Reviews",
  broker_connection: "Broker connection",
  broker_import: "Broker imports",
  chart_update: "Chart updates",
  data_decision: "Data Decisions",
  statement_import: "Statement imports",
});

function successMessage(message: string): boolean {
  return message === "Discord notification preferences saved." ||
    message === "Push notifications enabled on this device." ||
    message === "Push notifications turned off on this device." ||
    message === "Push notification preferences saved." ||
    message.startsWith("Push was turned off on this device.");
}

export function NotificationPreferences({
  initialDiscordDmCategories,
  initialWebPushCategories,
}: {
  initialDiscordDmCategories: readonly PlatformNotificationCategory[];
  initialWebPushCategories: readonly PlatformNotificationCategory[];
}) {
  const [selected, setSelected] = useState<readonly PlatformNotificationCategory[]>(initialDiscordDmCategories);
  const [pushSelected, setPushSelected] = useState<readonly PlatformNotificationCategory[]>(initialWebPushCategories);
  const [pushState, setPushState] = useState<PlatformWebPushBrowserState>("checking");
  const [discordMessage, setDiscordMessage] = useState<string | null>(null);
  const [pushMessage, setPushMessage] = useState<string | null>(null);
  const [pushPreparation, setPushPreparation] = useState<PreparedPlatformWebPush | null>(null);
  const [pushPreparationUnavailable, setPushPreparationUnavailable] = useState(false);
  const [working, startTransition] = useTransition();

  useEffect(() => {
    void readPlatformWebPushBrowserState()
      .then(setPushState)
      .catch(() => setPushState("off"));
    void preparePlatformWebPush()
      .then((prepared) => {
        setPushPreparation(prepared);
        setPushPreparationUnavailable(false);
      })
      .catch(() => setPushPreparationUnavailable(true));
  }, []);

  function toggle(category: PlatformNotificationCategory, checked: boolean): void {
    setSelected((current) => checked
      ? Object.freeze([...current, category].filter((value, index, values) => values.indexOf(value) === index))
      : current.filter((value) => value !== category));
  }

  function togglePush(category: PlatformNotificationCategory, checked: boolean): void {
    setPushSelected((current) => checked
      ? Object.freeze([...current, category].filter((value, index, values) => values.indexOf(value) === index))
      : current.filter((value) => value !== category));
  }

  function save(): void {
    startTransition(async () => {
      const result = await saveDiscordDmNotificationCategories(selected);
      if (result.ok) {
        setSelected(result.categories as readonly PlatformNotificationCategory[]);
        setDiscordMessage("Discord notification preferences saved.");
      } else {
        setDiscordMessage(result.message);
      }
    });
  }

  function enablePush(): void {
    if (!pushPreparation) {
      setPushMessage(pushPreparationUnavailable
        ? "Push notifications are not available yet."
        : "Push notifications are still getting ready. Try again in a moment.");
      return;
    }
    startTransition(async () => {
      try {
        await enablePlatformWebPush(pushSelected, pushPreparation);
        setPushState("enabled");
        setPushMessage("Push notifications enabled on this device.");
      } catch (error) {
        const nextState = await readPlatformWebPushBrowserState().catch(() => "off" as const);
        setPushState(nextState);
        setPushMessage(error instanceof Error ? error.message : "Push notifications could not be enabled.");
      }
    });
  }

  function retryPushPreparation(): void {
    setPushPreparationUnavailable(false);
    void preparePlatformWebPush()
      .then((prepared) => setPushPreparation(prepared))
      .catch(() => setPushPreparationUnavailable(true));
  }

  function disablePush(): void {
    startTransition(async () => {
      try {
        await disablePlatformWebPush();
        setPushState("off");
        setPushMessage("Push notifications turned off on this device.");
      } catch (error) {
        setPushState("off");
        setPushMessage(error instanceof Error ? error.message : "Push notifications were turned off on this device.");
      }
    });
  }

  function savePush(): void {
    startTransition(async () => {
      const result = await saveWebPushNotificationCategories(pushSelected);
      if (result.ok) {
        setPushSelected(result.categories as readonly PlatformNotificationCategory[]);
        setPushMessage("Push notification preferences saved.");
      } else {
        setPushMessage(result.message);
      }
    });
  }

  return (
    <Stack spacing={1.5}>
      <Typography sx={{ fontWeight: 800 }} variant="subtitle2">Discord messages</Typography>
      <Typography color="text.secondary" variant="body2">
        Choose which updates may also be sent by Discord DM. Every update stays in your dashboard Notifications page. Discord delivery will remain off until the TraderLink bot is connected.
      </Typography>
      {discordMessage ? <Alert severity={successMessage(discordMessage) ? "success" : "error"}>{discordMessage}</Alert> : null}
      <Stack spacing={0.25}>
        {PLATFORM_NOTIFICATION_CATEGORIES.map((category) => (
          <FormControlLabel
            control={<Checkbox checked={selected.includes(category)} onChange={(event) => toggle(category, event.target.checked)} />}
            key={category}
            label={labels[category]}
          />
        ))}
      </Stack>
      <Button disabled={working} onClick={save} sx={{ alignSelf: "flex-start" }} variant="contained">
        {working ? "Saving..." : "Save Discord preferences"}
      </Button>
      <Divider />
      <Typography sx={{ fontWeight: 800 }} variant="subtitle2">Push notifications</Typography>
      <Typography color="text.secondary" variant="body2">
        Choose which generic TraderLink alerts may appear on devices where you enable push. Lock-screen alerts never include tickers, P/L, prices, quantities, account details, statement names, notes or AI Review text.
      </Typography>
      {pushState === "unsupported" ? <Alert severity="info">Push notifications are not supported in this browser.</Alert> : null}
      {pushState === "denied" ? <Alert severity="warning">Push notifications are blocked in this browser&apos;s settings. Change this site&apos;s notification permission in your browser settings if you want to enable them.</Alert> : null}
      {pushPreparationUnavailable && pushState !== "unsupported" && pushState !== "denied" ? (
        <Alert severity="info">Push notifications are not available yet.</Alert>
      ) : null}
      {pushMessage ? <Alert severity={successMessage(pushMessage) ? "success" : "error"}>{pushMessage}</Alert> : null}
      <Stack spacing={0.25}>
        {PLATFORM_NOTIFICATION_CATEGORIES.map((category) => (
          <FormControlLabel
            control={<Checkbox checked={pushSelected.includes(category)} disabled={pushState === "unsupported" || pushState === "denied"} onChange={(event) => togglePush(category, event.target.checked)} />}
            key={`push-${category}`}
            label={labels[category]}
          />
        ))}
      </Stack>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ alignItems: { sm: "center" } }}>
        {pushState === "enabled" ? (
          <>
            <Button disabled={working} onClick={savePush} variant="contained">Save push preferences</Button>
            <Button color="error" disabled={working} onClick={disablePush} variant="outlined">Turn off push notifications</Button>
          </>
        ) : pushState === "checking" ? (
          <Button disabled variant="contained">Checking this device...</Button>
        ) : pushState === "unsupported" || pushState === "denied" ? null : pushPreparationUnavailable ? (
          <Button disabled={working} onClick={retryPushPreparation} variant="contained">
            Retry Push setup
          </Button>
        ) : (
          <Button
            disabled={working || pushPreparation === null}
            onClick={enablePush}
            variant="contained"
          >
            {pushPreparation === null && !pushPreparationUnavailable
              ? "Preparing notifications..."
              : "Enable push notifications"}
          </Button>
        )}
      </Stack>
    </Stack>
  );
}
