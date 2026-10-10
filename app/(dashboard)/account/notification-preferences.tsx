"use client";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Divider from "@mui/material/Divider";
import FormControlLabel from "@mui/material/FormControlLabel";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Link from "@mui/material/Link";
import { useEffect, useState, useTransition } from "react";
import { PushDeviceDiagnostics } from "@/app/pwa/push-device-diagnostics";

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
  confirmNotificationEmailAddress,
  requestNotificationEmailConfirmation,
  saveEmailNotificationCategories,
  saveMarketHaltAlertsEnabled,
  savePressReleasePushChannels,
  saveWebPushNotificationCategories,
  sendNotificationDeliveryTest,
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
  market_news: "The Week Ahead",
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

function pushMessageSeverity(message: string): "error" | "info" | "success" | "warning" {
  if (successMessage(message)) return "success";
  if (message.startsWith("Saving") || message.startsWith("Waiting") || message.startsWith("Checking") || message.includes("are ready")) {
    return "info";
  }
  return "error";
}

export function NotificationPreferences({
  allowedCategories,
  allowHalts,
  allowPressReleases,
  allowWatchlist,
  initialMarketHaltAlertsEnabled,
  initialDiscordDmCategories,
  initialEmailCategories,
  initialEmailStatus,
  initialPressReleasePushChannels,
  initialWebPushCategories,
  initialWatchlistPreferences,
}: {
  allowedCategories: readonly PlatformNotificationCategory[];
  allowHalts: boolean;
  allowPressReleases: boolean;
  allowWatchlist: boolean;
  initialMarketHaltAlertsEnabled: boolean;
  initialDiscordDmCategories: readonly PlatformNotificationCategory[];
  initialEmailCategories: readonly PlatformNotificationCategory[];
  initialEmailStatus: Readonly<{
    confirmationExpiresAtUtc: string | null;
    maskedEmailAddress: string | null;
    state: "none" | "pending_confirmation" | "confirmed";
  }>;
  initialPressReleasePushChannels: readonly PressReleasePushChannel[];
  initialWebPushCategories: readonly PlatformNotificationCategory[];
  initialWatchlistPreferences: Readonly<{ webPushEnabled: boolean; emailEnabled: boolean }>;
}) {
  const [selected, setSelected] = useState<readonly PlatformNotificationCategory[]>(initialDiscordDmCategories.filter(category => allowedCategories.includes(category)));
  const [emailSelected, setEmailSelected] = useState<readonly PlatformNotificationCategory[]>(initialEmailCategories.filter(category => allowedCategories.includes(category)));
  const [pushSelected, setPushSelected] = useState<readonly PlatformNotificationCategory[]>(initialWebPushCategories.filter(category => allowedCategories.includes(category)));
  const [watchlistPush, setWatchlistPush] = useState(allowWatchlist && initialWatchlistPreferences.webPushEnabled);
  const [watchlistEmail, setWatchlistEmail] = useState(allowWatchlist && initialWatchlistPreferences.emailEnabled);
  const [pressReleasePushSelected, setPressReleasePushSelected] = useState<readonly PressReleasePushChannel[]>(allowPressReleases ? initialPressReleasePushChannels : []);
  const [pushState, setPushState] = useState<PlatformWebPushBrowserState>("checking");
  const [discordMessage, setDiscordMessage] = useState<string | null>(null);
  const [emailAddress, setEmailAddress] = useState("");
  const [emailConfirmationCode, setEmailConfirmationCode] = useState("");
  const [emailMessage, setEmailMessage] = useState<string | null>(null);
  const [emailStatus, setEmailStatus] = useState(initialEmailStatus);
  const [deliveryTestMessage, setDeliveryTestMessage] = useState<string | null>(null);
  const [pushMessage, setPushMessage] = useState<string | null>(null);
  const [pushPreparation, setPushPreparation] = useState<PreparedPlatformWebPush | null>(null);
  const [pushServiceUnavailable, setPushServiceUnavailable] = useState(false);
  const [working, startTransition] = useTransition();
  const [marketHaltAlertsEnabled, setMarketHaltAlertsEnabled] = useState(allowHalts && initialMarketHaltAlertsEnabled);
  const pushChoiceCount = allowedCategories.length + Number(allowHalts) + Number(allowWatchlist) + (allowPressReleases ? PRESS_RELEASE_PUSH_CHANNELS.length : 0);
  const selectedPushChoiceCount = pushSelected.length + Number(watchlistPush) + Number(marketHaltAlertsEnabled) + pressReleasePushSelected.length;

  useEffect(() => {
    function refreshPushState(): void {
      void readPlatformWebPushBrowserState()
        .then(setPushState)
        .catch(() => setPushState("off"));
    }

    refreshPushState();
    window.addEventListener("focus", refreshPushState);
    void preparePlatformWebPush()
      .then((prepared) => {
        setPushPreparation(prepared);
        setPushServiceUnavailable(false);
      })
      .catch(() => {
        setPushPreparation(null);
        setPushServiceUnavailable(true);
      });
    return () => window.removeEventListener("focus", refreshPushState);
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

  function toggleEmail(category: PlatformNotificationCategory, checked: boolean): void {
    setEmailSelected((current) => checked
      ? Object.freeze([...current, category].filter((value, index, values) => values.indexOf(value) === index))
      : current.filter((value) => value !== category));
  }

  function togglePressReleasePush(channel: PressReleasePushChannel, checked: boolean): void {
    setPressReleasePushSelected((current) => checked
      ? Object.freeze([...current, channel].filter((value, index, values) => values.indexOf(value) === index))
      : current.filter((value) => value !== channel));
  }

  function toggleAllDiscord(checked: boolean): void {
    setSelected(checked ? allowedCategories : Object.freeze([]));
  }

  function toggleAllEmail(checked: boolean): void {
    setWatchlistEmail(checked && allowWatchlist);
    setEmailSelected(checked ? allowedCategories : Object.freeze([]));
  }

  function toggleAllPush(checked: boolean): void {
    setWatchlistPush(checked && allowWatchlist);
    setMarketHaltAlertsEnabled(checked && allowHalts);
    setPushSelected(checked ? allowedCategories : Object.freeze([]));
    setPressReleasePushSelected(checked && allowPressReleases ? PRESS_RELEASE_PUSH_CHANNELS : Object.freeze([]));
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
      savePush();
      return;
    }
    setPushMessage("Waiting for your device to approve push notifications...");
    startTransition(async () => {
      try {
        await enablePlatformWebPush(pushSelected, pushPreparation);
        const watchlistResult = await saveWebPushNotificationCategories(pushSelected, watchlistPush);
        if (!watchlistResult.ok) throw new Error(watchlistResult.message);
        const haltResult = await saveMarketHaltAlertsEnabled(marketHaltAlertsEnabled);
        if (!haltResult.ok) throw new Error(haltResult.message);
        setMarketHaltAlertsEnabled(haltResult.enabled);
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

  function requestEmailConfirmation(): void {
    startTransition(async () => {
      const result = await requestNotificationEmailConfirmation(emailAddress);
      setEmailMessage(result.message);
      if (result.ok) {
        setEmailStatus({
          confirmationExpiresAtUtc: null,
          maskedEmailAddress: null,
          state: "pending_confirmation",
        });
        setEmailConfirmationCode("");
      }
    });
  }

  function confirmEmail(): void {
    startTransition(async () => {
      const result = await confirmNotificationEmailAddress(emailConfirmationCode);
      setEmailMessage(result.message);
      if (result.ok) {
        setEmailStatus({ confirmationExpiresAtUtc: null, maskedEmailAddress: null, state: "confirmed" });
        setEmailConfirmationCode("");
      }
    });
  }

  function saveEmail(): void {
    startTransition(async () => {
      const result = await saveEmailNotificationCategories(emailSelected, watchlistEmail);
      if (result.ok) {
        setEmailSelected(result.categories as readonly PlatformNotificationCategory[]);
        setEmailMessage("Email notification preferences saved.");
      } else {
        setEmailMessage(result.message);
      }
    });
  }

  function sendDeliveryTest(): void {
    startTransition(async () => {
      const result = await sendNotificationDeliveryTest();
      setDeliveryTestMessage(result.message);
    });
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
    setPushMessage("Saving your push notification choices...");
    startTransition(async () => {
      try {
        const [result, haltResult, pressReleaseResult] = await Promise.all([
          saveWebPushNotificationCategories(pushSelected, watchlistPush),
          saveMarketHaltAlertsEnabled(marketHaltAlertsEnabled),
          savePressReleasePushChannels(pressReleasePushSelected),
        ]);
        if (result.ok && haltResult.ok && pressReleaseResult.ok) {
          setMarketHaltAlertsEnabled(haltResult.enabled);
          setPushSelected(result.categories as readonly PlatformNotificationCategory[]);
          setPressReleasePushSelected(pressReleaseResult.channels as readonly PressReleasePushChannel[]);
          setPushMessage("Push notification preferences saved.");
        } else if (!result.ok) {
          setPushMessage(result.message);
        } else if (!haltResult.ok) {
          setPushMessage(haltResult.message);
        } else if (!pressReleaseResult.ok) {
          setPushMessage(pressReleaseResult.message);
        }
      } catch {
        setPushMessage("Your push notification choices could not be saved.");
      }
    });
  }

  return (
    <Stack spacing={1.5}>
      {allowedCategories.length < PLATFORM_NOTIFICATION_CATEGORIES.length || !allowHalts || !allowPressReleases || !allowWatchlist ? <Alert severity="info">
        Some notifications are not included in your current access.
        {PLATFORM_NOTIFICATION_CATEGORIES.filter(category => !allowedCategories.includes(category)).map(category => <Link key={category} href={`/plans?feature=notifications.${category}`} sx={{ display: "block" }}>View plans for {labels[category]}</Link>)}
        {!allowHalts ? <Link href="/plans?feature=notifications.market_halt" sx={{ display: "block" }}>View plans for halt notifications</Link> : null}
        {!allowPressReleases ? <Link href="/plans?feature=notifications.press_release" sx={{ display: "block" }}>View plans for press release notifications</Link> : null}
        {!allowWatchlist ? <Link href="/plans?feature=notifications.watchlist" sx={{ display: "block" }}>View plans for Watchlist notifications</Link> : null}
      </Alert> : null}
      <Typography sx={{ fontWeight: 800 }} variant="subtitle2">Discord messages</Typography>
      <Typography color="text.secondary" variant="body2">
        Choose which updates may also be sent by Discord DM. Every update stays in your dashboard Notifications page.
      </Typography>
      {discordMessage ? <Alert severity={successMessage(discordMessage) ? "success" : "error"}>{discordMessage}</Alert> : null}
      <Stack spacing={0.25}>
        <FormControlLabel
          control={<Checkbox checked={allowedCategories.length > 0 && selected.length === allowedCategories.length} disabled={!allowedCategories.length} indeterminate={selected.length > 0 && selected.length < allowedCategories.length} onChange={(event) => toggleAllDiscord(event.target.checked)} />}
          label="Select all"
        />
        {PLATFORM_NOTIFICATION_CATEGORIES.map((category) => (
          <FormControlLabel
            control={<Checkbox checked={selected.includes(category)} disabled={!allowedCategories.includes(category)} onChange={(event) => toggle(category, event.target.checked)} />}
            key={category}
            label={labels[category]}
          />
        ))}
      </Stack>
      <Button disabled={working} onClick={save} sx={{ alignSelf: "flex-start" }} variant="contained">
        {working ? "Saving..." : "Save Preferences"}
      </Button>
      <Divider />
      <Typography sx={{ fontWeight: 800 }} variant="subtitle2">Email notifications</Typography>
      <Typography color="text.secondary" variant="body2">
        Choose an email address and the updates you want delivered there.
      </Typography>
      {emailStatus.state === "confirmed" ? (
        <Alert severity="success">Email confirmed{emailStatus.maskedEmailAddress ? `: ${emailStatus.maskedEmailAddress}` : "."}</Alert>
      ) : null}
      {emailStatus.state === "pending_confirmation" ? (
        <Alert severity="info">Select Verify notification email in the email we sent you.</Alert>
      ) : null}
      {emailMessage ? <Alert severity={emailMessage.includes("saved") || emailMessage.includes("confirmed") || emailMessage.includes("sent") ? "success" : "error"}>{emailMessage}</Alert> : null}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
        <TextField
          autoComplete="email"
          label="Email address"
          onChange={(event) => setEmailAddress(event.target.value)}
          size="small"
          type="email"
          value={emailAddress}
        />
        <Button disabled={working || !emailAddress.trim()} onClick={requestEmailConfirmation} variant="outlined">
          {working ? "Sending..." : "Send verification email"}
        </Button>
      </Stack>
      {emailStatus.state === "pending_confirmation" ? (
        <Stack spacing={0.5}>
          <Typography color="text.secondary" variant="body2">Can&apos;t open the link? Enter the code from the email instead.</Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <TextField
              label="Confirmation code"
              onChange={(event) => setEmailConfirmationCode(event.target.value)}
              size="small"
              value={emailConfirmationCode}
            />
            <Button disabled={working || !emailConfirmationCode.trim()} onClick={confirmEmail} variant="contained">
              {working ? "Checking..." : "Confirm email"}
            </Button>
          </Stack>
        </Stack>
      ) : null}
      <Stack spacing={0.25}>
        <FormControlLabel
          control={<Checkbox checked={allowedCategories.length + Number(allowWatchlist) > 0 && emailSelected.length + Number(watchlistEmail) === allowedCategories.length + Number(allowWatchlist)} disabled={!allowedCategories.length && !allowWatchlist} indeterminate={emailSelected.length + Number(watchlistEmail) > 0 && emailSelected.length + Number(watchlistEmail) < allowedCategories.length + Number(allowWatchlist)} onChange={(event) => toggleAllEmail(event.target.checked)} />}
          label="Select all"
        />
        {PLATFORM_NOTIFICATION_CATEGORIES.map((category) => (
          <FormControlLabel
            control={<Checkbox checked={emailSelected.includes(category)} disabled={!allowedCategories.includes(category)} onChange={(event) => toggleEmail(category, event.target.checked)} />}
            key={`email-${category}`}
            label={labels[category]}
          />
        ))}
        <FormControlLabel control={<Checkbox checked={watchlistEmail} disabled={!allowWatchlist} onChange={(event) => setWatchlistEmail(event.target.checked)} />} label="Watchlist" />
      </Stack>
      <Button disabled={working} onClick={saveEmail} sx={{ alignSelf: "flex-start" }} variant="contained">
        {working ? "Saving..." : "Save Email Preferences"}
      </Button>
      <Divider />
      <Typography sx={{ fontWeight: 800 }} variant="subtitle2">Test notification delivery</Typography>
      <Typography color="text.secondary" variant="body2">
        Send a private test only to your selected Discord and email channels for Chart updates.
      </Typography>
      {deliveryTestMessage ? <Alert severity={deliveryTestMessage.startsWith("Test notification queued") ? "success" : "error"}>{deliveryTestMessage}</Alert> : null}
      <Button disabled={working} onClick={sendDeliveryTest} sx={{ alignSelf: "flex-start" }} variant="outlined">
        {working ? "Sending..." : "Send test notification"}
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
        Choose which alerts you want to receive. Your browser or device must also allow notifications from TradersLink.
      </Typography>
      {pushState === "off" && pushPreparation && !pushServiceUnavailable ? (
        <Alert severity="info">Notifications are off on this device. Select Turn on notifications below to receive your chosen alerts.</Alert>
      ) : null}
      {pushState === "unsupported" ? (
        <Alert severity="warning">Push notifications are not available in this browser or on this device.</Alert>
      ) : null}
      {pushState === "denied" ? (
        <Alert severity="warning">
          Push notifications are turned off for TradersLink on this device. Allow TradersLink in your browser or device notification settings. On Android, also check Chrome notifications if your phone lists Chrome as the sender. Return here after changing the setting.
        </Alert>
      ) : null}
      {pushServiceUnavailable && pushState !== "unsupported" && pushState !== "denied" ? (
        <Alert severity="warning">
          Push notifications are not available for TradersLink right now. Your alert choices can still be saved, but this is a TradersLink setup issue—not something you can turn on in this app.
        </Alert>
      ) : null}
      <Stack spacing={0.25}>
        <FormControlLabel
          control={<Checkbox checked={pushChoiceCount > 0 && selectedPushChoiceCount === pushChoiceCount} disabled={!pushChoiceCount || pushState === "unsupported" || pushState === "denied"} indeterminate={selectedPushChoiceCount > 0 && selectedPushChoiceCount < pushChoiceCount} onChange={(event) => toggleAllPush(event.target.checked)} />}
          label="Select all"
        />
        {PLATFORM_NOTIFICATION_CATEGORIES.map((category) => (
          <FormControlLabel
            control={<Checkbox checked={pushSelected.includes(category)} disabled={!allowedCategories.includes(category) || pushState === "unsupported" || pushState === "denied"} onChange={(event) => togglePush(category, event.target.checked)} />}
            key={`push-${category}`}
            label={labels[category]}
          />
        ))}
        <FormControlLabel control={<Checkbox checked={watchlistPush} disabled={!allowWatchlist || pushState === "unsupported" || pushState === "denied"} onChange={(event) => setWatchlistPush(event.target.checked)} />} label="Watchlist" />
        <FormControlLabel control={<Checkbox checked={marketHaltAlertsEnabled} disabled={!allowHalts || pushState === "unsupported" || pushState === "denied"} onChange={(event) => setMarketHaltAlertsEnabled(event.target.checked)} />} label="Halt alerts" />
        {PRESS_RELEASE_PUSH_CHANNELS.map((channel) => (
          <FormControlLabel
            control={<Checkbox checked={pressReleasePushSelected.includes(channel)} disabled={!allowPressReleases || pushState === "unsupported" || pushState === "denied"} onChange={(event) => togglePressReleasePush(channel, event.target.checked)} />}
            key={`press-release-push-${channel}`}
            label={pressReleaseLabels[channel]}
          />
        ))}
      </Stack>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ alignItems: { sm: "center" } }}>
        {pushState === "enabled" ? (
          <>
            <Button disabled={working} onClick={savePush} variant="contained">{working ? "Saving..." : "Save alert choices"}</Button>
            <Button color="error" disabled={working} onClick={disablePush} variant="outlined">Turn off push notifications</Button>
          </>
        ) : pushState === "checking" ? (
          <Button disabled variant="contained">Checking notifications…</Button>
        ) : pushState === "unsupported" || pushState === "denied" ? null : pushPreparation === null ? (
          <Button disabled={working} onClick={savePush} variant="contained">{working ? "Saving..." : "Save alert choices"}</Button>
        ) : (
          <Button
            disabled={working || pushPreparation === null}
            onClick={enablePush}
            variant="contained"
          >
            {working ? "Turning on..." : "Turn on notifications"}
          </Button>
        )}
      </Stack>
      {pushMessage ? (
        <Alert aria-live="polite" role="status" severity={pushMessageSeverity(pushMessage)}>
          {pushMessage}
        </Alert>
      ) : null}
      <PushDeviceDiagnostics />
    </Stack>
  );
}
