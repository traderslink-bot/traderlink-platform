"use client";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useState, useTransition } from "react";

import { saveFridayAiReviewDeliveryTime } from "./actions";

const DELIVERY_TIMES = Array.from({ length: 16 }, (_, index) => {
  const totalMinutes = 16 * 60 + index * 30;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const value = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  return Object.freeze({
    value,
    label: `${hours - 12}:${String(minutes).padStart(2, "0")} PM Eastern`,
  });
});

export function WeeklyReviewScheduleSettings({ initialDeliveryTimeEastern }: {
  initialDeliveryTimeEastern: string | null;
}) {
  const [selectedTime, setSelectedTime] = useState(initialDeliveryTimeEastern ?? "18:00");
  const [savedTime, setSavedTime] = useState(initialDeliveryTimeEastern);
  const [message, setMessage] = useState<string | null>(null);
  const [working, startTransition] = useTransition();

  function save(): void {
    startTransition(async () => {
      const result = await saveFridayAiReviewDeliveryTime(selectedTime);
      if (result.ok) {
        setSavedTime(result.fridayDeliveryTimeEastern);
        setMessage("Friday delivery time saved.");
      } else {
        setMessage(result.message);
      }
    });
  }

  return (
    <Stack spacing={1.5}>
      <Typography color="text.secondary" variant="body2">
        Pick when you want your weekly review to arrive each Friday. Times are Eastern.
      </Typography>
      {message ? <Alert severity={message === "Friday delivery time saved." ? "success" : "error"}>{message}</Alert> : null}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ alignItems: { sm: "center" } }}>
        <TextField label="Friday delivery time" onChange={(event) => setSelectedTime(event.target.value)} select sx={{ minWidth: { sm: 250 } }} value={selectedTime}>
          {DELIVERY_TIMES.map((time) => <MenuItem key={time.value} value={time.value}>{time.label}</MenuItem>)}
        </TextField>
        <Button disabled={working || selectedTime === savedTime} onClick={save} variant="contained">
          {working ? "Saving..." : savedTime ? "Update time" : "Set Friday time"}
        </Button>
      </Stack>
    </Stack>
  );
}
