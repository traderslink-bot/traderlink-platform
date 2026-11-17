"use client";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useEffect, useId, useRef, useState } from "react";

import { DashboardPanel, DashboardSecondaryAction } from "@/app/dashboard-template";
import type { PartnerAlertDeliveryActivity, PartnerAlertDeliveryActivityView } from "@/src/modules/partner-alerts/server/partner-alert-delivery-activity";

const statusCopy = {
  held: { label: "Held", color: "warning" },
  pending: { label: "Awaiting delivery", color: "default" },
  uncertain: { label: "Delivery unconfirmed", color: "warning" },
  failed: { label: "Delivery failed", color: "error" },
  published: { label: "Synced to Discord", color: "success" },
  removed: { label: "Removed from Discord", color: "default" },
  expired_unsent: { label: "Delivery expired", color: "warning" },
  not_published: { label: "No delivery recorded", color: "default" },
} as const;
const receivedFormat = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" });

async function readActivity(endpoint: string, signal: AbortSignal, messageId?: string) {
  const query = new URLSearchParams({ activity: "1" });
  if (messageId) query.set("message", messageId);
  const response = await fetch(`${endpoint}?${query}`, { cache: "no-store", credentials: "same-origin", signal });
  if (!response.ok) throw new Error("Alert activity unavailable");
  const { ok, result } = await response.json() as { ok?: boolean; result?: PartnerAlertDeliveryActivityView };
  if (!ok || !Array.isArray(result?.alerts)) throw new Error("Alert activity unavailable");
  return result;
}

export function PartnerAlertActivityPanel({ endpoint }: { endpoint: string }) {
  const [refresh, setRefresh] = useState(0);
  const [alerts, setAlerts] = useState<readonly PartnerAlertDeliveryActivity[] | "loading" | "unavailable">("loading");
  const [selected, setSelected] = useState<PartnerAlertDeliveryActivity | null>(null);
  const refreshButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    void readActivity(endpoint, controller.signal).then(result => {
      if (!controller.signal.aborted) setAlerts(result.alerts);
    }).catch(() => {
      if (!controller.signal.aborted) setAlerts("unavailable");
    });
    return () => controller.abort();
  }, [endpoint, refresh]);

  return <DashboardPanel title="Recent alerts" action={<DashboardSecondaryAction ref={refreshButton} disabled={alerts === "loading"}
    onClick={() => { setAlerts("loading"); setRefresh(value => value + 1); }}>Refresh alerts</DashboardSecondaryAction>}>
    {alerts === "loading" ? <Typography role="status">Loading alerts…</Typography>
      : alerts === "unavailable" ? <Alert severity="warning">Could not load recent alerts.</Alert>
      : alerts.length === 0 ? <Typography color="text.secondary">No alerts recorded yet.</Typography>
      : <Stack component="ul" divider={<Divider component="li" aria-hidden />} spacing={1.5} sx={{ m: 0, p: 0, listStyle: "none" }}>
        {alerts.map(alert => <Stack component="li" spacing={0.75} key={alert.messageId}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ alignItems: { xs: "flex-start", sm: "center" } }}>
            <Typography sx={{ flex: 1, fontWeight: 700, overflowWrap: "anywhere" }}>{alert.channelName}</Typography>
            <Chip size="small" {...statusCopy[alert.delivery]} />
          </Stack>
          <Typography component="time" dateTime={alert.receivedAtUtc} color="text.secondary" variant="body2">
            {receivedFormat.format(new Date(alert.receivedAtUtc))}
          </Typography>
          <Typography variant="caption" color="text.secondary">Discord message ID {alert.messageId}</Typography>
          {alert.holdReasons.map(reason => <Typography key={reason} variant="body2">{reason}</Typography>)}
          {alert.textState === "available" ? <Button sx={{ alignSelf: "flex-start" }} variant="outlined"
            onClick={() => setSelected(alert)} aria-label={`View alert text for message ${alert.messageId}`}>View alert text</Button>
            : <Typography variant="body2" color="text.secondary">
              {alert.textState === "expired" ? "Alert text expired" : "Alert text unavailable"}
            </Typography>}
        </Stack>)}
      </Stack>}
    {selected ? <PartnerAlertTextDialog alert={selected} endpoint={endpoint} onClose={() => setSelected(null)}
      onExpire={() => {
        setAlerts(items => typeof items === "string" ? items : items.map(item => item.messageId === selected.messageId
          ? { ...item, textState: "expired" } : item));
        requestAnimationFrame(() => refreshButton.current?.focus());
      }} /> : null}
  </DashboardPanel>;
}

function PartnerAlertTextDialog({ alert, endpoint, onClose, onExpire }: {
  alert: PartnerAlertDeliveryActivity; endpoint: string; onClose: () => void; onExpire: () => void;
}) {
  const titleId = useId();
  const [text, setText] = useState<"loading" | "expired" | "unavailable" | { body: string }>("loading");
  useEffect(() => {
    const controller = new AbortController();
    const started = performance.now();
    let expiry: ReturnType<typeof setTimeout> | undefined;
    void readActivity(endpoint, controller.signal, alert.messageId).then(result => {
      if (controller.signal.aborted) return;
      const opened = result.openedText;
      const remaining = opened ? opened.remainingMs - (performance.now() - started) : 0;
      if (opened && remaining > 0) {
        setText({ body: opened.body });
        expiry = setTimeout(() => setText("expired"), remaining);
      } else {
        setText(opened || result.alerts[0]?.textState === "expired" ? "expired" : "unavailable");
      }
    }).catch(() => {
      if (!controller.signal.aborted) setText("unavailable");
    });
    return () => { controller.abort(); clearTimeout(expiry); };
  }, [alert.messageId, endpoint]);
  const close = () => { if (text === "expired") onExpire(); onClose(); };

  return <Dialog open fullWidth maxWidth="sm" aria-labelledby={titleId} onClose={close}>
    <DialogTitle id={titleId}>{alert.channelName}</DialogTitle>
    <DialogContent>
      <Typography variant="caption" component="p" color="text.secondary" sx={{ mb: 1.5 }}>
        Discord message ID {alert.messageId}
      </Typography>
      {typeof text === "object" ? <Typography sx={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{text.body}</Typography>
        : <Typography role="status">{text === "loading" ? "Loading alert text…" : text === "expired" ? "Alert text expired" : "Alert text unavailable"}</Typography>}
    </DialogContent>
    <DialogActions><Button onClick={close}>Close</Button></DialogActions>
  </Dialog>;
}
