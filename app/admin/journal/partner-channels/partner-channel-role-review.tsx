"use client";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useEffect, useState, type FormEvent } from "react";

import { JOURNAL_ADMIN_REQUEST_HEADER } from "@/src/modules/platform/contracts/journal-admin-request";

type ReviewEvent = Readonly<{
  communityId: string;
  eventId: string;
  eventType: string;
  environment: string;
  resourceKind: string;
  resourceId: string;
  provider?: "stripe";
  allowRemove?: boolean;
  communityName?: string;
  offerTitle?: string;
}>;

const endpoint = "/api/admin/journal/partner-channels/role-review";
const eventKey = (item: ReviewEvent) => `${item.provider ?? "whop"}/${item.communityId}/${item.environment}/${item.eventId}`;
const stripeEventTitle: Readonly<Record<string, string>> = {
  "invoice.payment_failed": "Renewal payment failed",
  "charge.refunded": "Refund",
  "charge.dispute.created": "Dispute opened",
  "charge.dispute.closed": "Dispute resolved",
  "customer.subscription.deleted": "Subscription ended",
};

export function PartnerChannelRoleReview() {
  const [events, setEvents] = useState<ReviewEvent[]>([]);
  const [selected, setSelected] = useState("");
  const [decision, setDecision] = useState("needs_evidence");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ severity: "error" | "success"; message: string } | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    void fetch(endpoint, { cache: "no-store", signal: controller.signal }).then(async response => {
      const body = await response.json();
      if (!response.ok || body.ok !== true || !Array.isArray(body.result)) throw new Error();
      setEvents(body.result);
    }).catch(() => {
      if (!controller.signal.aborted) setFeedback({ severity: "error", message: "Discord role reviews are temporarily unavailable." });
    });
    return () => controller.abort();
  }, []);

  const item = events.find(event => eventKey(event) === selected);
  const stripe = item?.provider === "stripe";
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!item || submitting) return;
    const fields = new FormData(event.currentTarget);
    setSubmitting(true);
    setFeedback(null);
    try {
      const reviewEndpoint = stripe
        ? `/api/admin/journal/partner-channels/${encodeURIComponent(item.communityId)}/stripe-role-review` : endpoint;
      const body = stripe ? { eventId: item.eventId, decision: decision === "remove" ? "remove" : "keep" }
        : { communityId: item.communityId, eventId: item.eventId, decision,
          mappingId: String(fields.get("mappingId") ?? "").trim(),
          membershipId: item.resourceKind === "membership" ? item.resourceId : String(fields.get("membershipId") ?? "").trim(),
          evidenceNote: String(fields.get("evidenceNote") ?? "").trim() };
      const response = await fetch(reviewEndpoint, { method: "POST", cache: "no-store",
        headers: { "content-type": "application/json", [JOURNAL_ADMIN_REQUEST_HEADER]: "1" }, body: JSON.stringify(body) });
      if (!response.ok) throw new Error();
      if (stripe) {
        setEvents(current => current.filter(event => eventKey(event) !== selected));
        setSelected("");
      }
      setFeedback({ severity: "success", message: stripe ? "Decision recorded. TraderLink will check paid access before changing a Discord role."
        : decision === "remove" ? "Discord confirmed removal of the channel role." : "Review decision recorded." });
    } catch {
      setFeedback({ severity: "error", message: "The review could not be confirmed. Recheck payment status and the current Discord role before retrying." });
    } finally { setSubmitting(false); }
  }

  return <Paper variant="outlined" sx={{ p: 2.5 }}>
    <Stack spacing={2} component="form" onSubmit={submit}>
      <Typography component="h2" variant="h6">Discord role reviews</Typography>
      {feedback && <Alert severity={feedback.severity}>{feedback.message}</Alert>}
      {events.length > 0 && <TextField select label="Billing event" value={selected} disabled={submitting}
        onChange={event => {
          const value = event.target.value;
          setSelected(value);
          setDecision(events.find(item => eventKey(item) === value)?.provider === "stripe" ? "retain" : "needs_evidence");
          setFeedback(null);
        }}>
        {events.map(event => <MenuItem key={eventKey(event)} value={eventKey(event)}>
          {event.provider === "stripe"
            ? [stripeEventTitle[event.eventType] ?? "Stripe billing event", event.communityName, event.offerTitle].filter(Boolean).join(" · ")
            : `${event.eventType} · ${event.resourceId} · ${event.environment}`}
        </MenuItem>)}
      </TextField>}
      {item && stripe ? <Stack spacing={2}>
        <TextField select label="Decision" value={decision} disabled={submitting} onChange={event => setDecision(event.target.value)}>
          <MenuItem value="retain">Keep access</MenuItem>
          {item.allowRemove ? <MenuItem value="remove">Approve removal if paid access ended</MenuItem> : null}
        </TextField>
        <Button type="submit" variant="outlined" disabled={submitting} sx={{ alignSelf: "flex-start" }}>Record decision</Button>
      </Stack> : null}
      {item && !stripe && item.resourceKind !== "account" && <Stack key={selected} spacing={2}>
        <TextField required name="mappingId" label="Channel mapping ID" disabled={submitting} />
        {item.resourceKind !== "membership" && <TextField required name="membershipId" label="Whop membership ID" disabled={submitting} />}
        <TextField select label="Decision" value={decision} disabled={submitting} onChange={event => setDecision(event.target.value)}>
          <MenuItem value="needs_evidence">Keep open for more evidence</MenuItem>
          <MenuItem value="retain">Keep access</MenuItem>
          <MenuItem value="remove">Remove channel role</MenuItem>
        </TextField>
        <TextField required name="evidenceNote" label="Evidence checked" disabled={submitting}
          slotProps={{ htmlInput: { maxLength: 500 } }} />
        {decision === "remove" && <Alert severity="warning">
          Remove only after checking that the buyer has no remaining paid period or other channel or package purchase that covers this channel.
        </Alert>}
        <Button type="submit" variant="outlined" color={decision === "remove" ? "error" : "primary"} disabled={submitting}
          sx={{ alignSelf: "flex-start" }}>{decision === "remove" ? "Confirm role removal" : "Record decision"}</Button>
      </Stack>}
      {item?.resourceKind === "account" && <Alert severity="info">Review the connection before making a role decision for a buyer.</Alert>}
    </Stack>
  </Paper>;
}
