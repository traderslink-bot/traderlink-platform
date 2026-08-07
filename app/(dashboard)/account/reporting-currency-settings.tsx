"use client";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useState, useTransition } from "react";

import { saveReportingCurrency } from "./reporting-currency-actions";

const CURRENCIES = [
  ["USD", "US dollar"],
  ["CAD", "Canadian dollar"],
  ["AUD", "Australian dollar"],
  ["BRL", "Brazilian real"],
  ["CNY", "Chinese renminbi"],
  ["EUR", "Euro"],
  ["HKD", "Hong Kong dollar"],
  ["INR", "Indian rupee"],
  ["IDR", "Indonesian rupiah"],
  ["JPY", "Japanese yen"],
  ["MYR", "Malaysian ringgit"],
  ["MXN", "Mexican peso"],
  ["NZD", "New Zealand dollar"],
  ["NOK", "Norwegian krone"],
  ["PEN", "Peruvian sol"],
  ["PLN", "Polish zloty"],
  ["SGD", "Singapore dollar"],
  ["ZAR", "South African rand"],
  ["KRW", "South Korean won"],
  ["SEK", "Swedish krona"],
  ["CHF", "Swiss franc"],
  ["TWD", "Taiwanese dollar"],
  ["THB", "Thai baht"],
  ["TRY", "Turkish lira"],
  ["GBP", "UK pound sterling"],
] as const;

export function ReportingCurrencySettings({
  reportingCurrency,
}: {
  reportingCurrency: string;
}) {
  const [selectedCurrency, setSelectedCurrency] = useState(reportingCurrency);
  const [message, setMessage] = useState<string | null>(null);
  const [working, startTransition] = useTransition();

  function save(): void {
    startTransition(async () => {
      const result = await saveReportingCurrency(selectedCurrency);
      if (result.ok) {
        setSelectedCurrency(result.reportingCurrency);
        setMessage("Reporting currency saved.");
      } else {
        setMessage(result.message);
      }
    });
  }

  return (
    <Stack spacing={1.5}>
      <Typography color="text.secondary" variant="body2">Select the currency you want displayed in your dashboard. Your USD trade execution records stay unchanged.</Typography>
      {message ? <Alert severity={message === "Reporting currency saved." ? "success" : "error"}>{message}</Alert> : null}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ alignItems: { sm: "center" } }}>
        <TextField
          label="Preferred currency"
          onChange={(event) => setSelectedCurrency(event.target.value)}
          select
          sx={{ minWidth: { sm: 280 } }}
          value={selectedCurrency}
        >
          {CURRENCIES.map(([code, label]) => (
            <MenuItem key={code} value={code}>{code} — {label}</MenuItem>
          ))}
        </TextField>
        <Button disabled={working || selectedCurrency === reportingCurrency} onClick={save} variant="contained">
          {working ? "Saving..." : "Save preference"}
        </Button>
      </Stack>
    </Stack>
  );
}
