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
  savePressReleasePushChannels,
  saveWebPushNotificationCategories,
} from "./notification-preferences-actions";
import {
  PRESS_RELEASE_PUSH_CHANNELS,
  type PressReleasePushChannel,
} from "@/src/modules/news/contracts/press-release-dashboard-contracts";

const labels: Readonly<Record<PlatformNotificationCategory, string>> = Object.freeze({
  ai_review: "AI Reviews",
  broker_connection: "Broker connection",
  broker_import: "Broker imports",
  chart_update: "Chart updates",
  data_decision: "Data Decisions",
  statement_import: "Statement imports",
});

const pressReleaseLabels: Readonly<Record<PressReleasePushChannel, string>> = Object.freeze({
  news_filtered: "News Filtered",
  market_cap_under_30m: "Market cap under $30M",
  market_cap_30m_to_50m: "Market cap $30M–$50M",
  market_cap_50m_to_100m: "Market cap $50M–$100M",
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
  initialPressReleasePushChannels,
  initialWebPushCategories,
}: {
  initialDiscordDmCategories: readonly PlatformNotificationCategory[];
  initialPressReleasePushChannels: readonly PressReleasePushChannel[];
  initialWebPushCategories: readonly PlatformNotificationCategory[];
}) {
  const [selected, setSelected] = useState<readonly PlatformNotificationCategory[]>(initialDiscordDmCategories);
  const [pushSelected, setPushSelected] = useState<readonly PlatformNotificationCategory[]>(initialWebPushCategories);
  const [pressReleasePushSelected, setPressReleasePushSelected] = useState<readonly PressReleasePushChannel[]>(initialPressReleasePushChannels);
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

  function togglePressReleasePush(channel: PressReleasePushChannel, checked: boolean): void {
    setPressReleasePushSelected((current) => checked
      ? Object.freeze([...current, channel].filter((value, index, values) => values.indexOf(value) === index))
      : current.filter((value) => value !== channel));
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
        const pressReleaseResult = await savePressReleasePushChannels(pressReleasePushSelected);
        if (!pressReleaseResult.ok) throw new Error(pressReleaseResult.message);
        setPressReleasePushSelected(pressReleaseResult.channels as readonly PressReleasePushChannel[]);
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
      const [result, pressReleaseResult] = await Promise.all([
        saveWebPushNotificationCategories(pushSelected),
        savePressReleasePushChannels(pressReleasePushSelected),
      ]);
      if (result.ok && pressReleaseResult.ok) {
        setPushSelected(result.categories as readonly PlatformNotificationCategory[]);
        setPressReleasePushSelected(pressReleaseResult.channels as readonly PressReleasePushChannel[]);
        setPushMessage("Push notification preferences saved.");
      } else if (!result.ok) {
        setPushMessage(result.message);
      } else if (!pressReleaseResult.ok) {
        setPushMessage(pressReleaseResult.message);
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
      <Typography
        id="push-notifications"
        sx={{ fontWeight: 800, scrollMarginTop: 96 }}
        variant="subtitle2"
      >
        Push notifications
      </Typography>
      <Typography color="text.secondary" variant="body2">
        Choose which TraderLink alerts may appear on devices where you enable push. Account and trading alerts stay private and generic. Press release alerts show the public ticker and headline so you can open the article directly.
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
      <Divider />
      <Typography sx={{ fontWeight: 800 }} variant="subtitle2">Press release alerts</Typography>
      <Typography color="text.secondary" variant="body2">
        These choices match the Press Releases channels in your dashboard. Each alert opens the article directly in its dashboard drawer.
      </Typography>
      <Stack spacing={0.25}>
        {PRESS_RELEASE_PUSH_CHANNELS.map((channel) => (
          <FormControlLabel
            control={<Checkbox checked={pressReleasePushSelected.includes(channel)} disabled={pushState === "unsupported" || pushState === "denied"} onChange={(event) => togglePressReleasePush(channel, event.target.checked)} />}
            key={`press-release-push-${channel}`}
            label={pressReleaseLabels[channel]}
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
