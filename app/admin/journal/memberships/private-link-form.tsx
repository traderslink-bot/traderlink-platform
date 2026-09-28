"use client";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useActionState } from "react";

import {
  createPrivatePlanLinkAction,
  type CreatePrivatePlanLinkState,
} from "./membership-actions";

const INITIAL: CreatePrivatePlanLinkState = Object.freeze({ url: null, error: null });

export function PrivatePlanLinkForm({
  offers,
}: {
  offers: readonly Readonly<{ offerId: string; label: string }>[];
}) {
  const [state, action, pending] = useActionState(createPrivatePlanLinkAction, INITIAL);
  return (
    <Stack action={action} component="form" spacing={2}>
      <TextField label="Link name" name="name" required />
      <TextField label="Audience note" minRows={2} multiline name="audienceNote" />
      <Typography variant="body2">Select any offers, or create an empty page and add offers later in Private links. The URL stays the same.</Typography>
      <Stack>
        {offers.map((offer) => (
          <FormControlLabel control={<Checkbox name="offerIds" value={offer.offerId} />} key={offer.offerId} label={offer.label} />
        ))}
      </Stack>
      <TextField helperText="Optional UTC timestamp, for example 2026-12-01T05:00:00.000Z" label="Expires at" name="expiresAtUtc" />
      <TextField slotProps={{ htmlInput: { min: 1, step: 1 } }} label="Maximum claims" name="maximumClaims" type="number" />
      <Button disabled={pending} type="submit" variant="contained">
        {pending ? "Creating link..." : "Create private link"}
      </Button>
      {state.error ? <Alert severity="error">{state.error}</Alert> : null}
      {state.url ? (
        <Alert severity="success">
          Private link created. Copy it now: <a href={state.url}>{state.url}</a>
        </Alert>
      ) : null}
    </Stack>
  );
}
