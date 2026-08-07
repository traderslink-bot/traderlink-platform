"use client";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useState, useTransition } from "react";

import { saveAiReviewDelivery } from "./ai-review-delivery-actions";

const WEEKEND_DAYS = [["friday", "Friday"], ["saturday", "Saturday"], ["sunday", "Sunday"]] as const;
const DELIVERY_TIMES = Array.from({ length: 16 }, (_, index) => {
  const totalMinutes = 16 * 60 + index * 30;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const value = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  return Object.freeze({ value, label: `${hours - 12}:${String(minutes).padStart(2, "0")} PM Eastern` });
});

export function AiReviewDeliverySettings({ initialDeliveryDay, initialDeliveryTimeEastern }: {
  initialDeliveryDay: "friday" | "saturday" | "sunday" | null;
  initialDeliveryTimeEastern: string | null;
}) {
  const [day, setDay] = useState(initialDeliveryDay ?? "friday");
  const [time, setTime] = useState(initialDeliveryTimeEastern ?? "18:00");
  const [saved, setSaved] = useState(initialDeliveryDay && initialDeliveryTimeEastern ? `${initialDeliveryDay}-${initialDeliveryTimeEastern}` : null);
  const [message, setMessage] = useState<string | null>(null);
  const [working, startTransition] = useTransition();

  function save(): void {
    startTransition(async () => {
      const result = await saveAiReviewDelivery({ weeklyDeliveryDay: day, deliveryTimeEastern: time });
      if (result.ok) {
        setSaved(`${result.weeklyDeliveryDay}-${result.deliveryTimeEastern}`);
        setMessage("AI Review delivery settings saved.");
      } else setMessage(result.message);
    });
  }

  return (
    <Stack spacing={1.5}>
      <Typography color="text.secondary" variant="body2">Choose when your weekly review arrives. Your monthly review arrives the next day after month end.</Typography>
      {message ? <Alert severity={message === "AI Review delivery settings saved." ? "success" : "error"}>{message}</Alert> : null}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ alignItems: { sm: "center" } }}>
        <TextField label="Weekly review day" onChange={(event) => setDay(event.target.value as typeof day)} select sx={{ minWidth: { sm: 180 } }} value={day}>{WEEKEND_DAYS.map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}</TextField>
        <TextField label="Delivery time" onChange={(event) => setTime(event.target.value)} select sx={{ minWidth: { sm: 220 } }} value={time}>{DELIVERY_TIMES.map((entry) => <MenuItem key={entry.value} value={entry.value}>{entry.label}</MenuItem>)}</TextField>
        <Button disabled={working || `${day}-${time}` === saved} onClick={save} variant="contained">{working ? "Saving..." : saved ? "Update delivery" : "Set delivery"}</Button>
      </Stack>
    </Stack>
  );
}
