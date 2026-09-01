"use client";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import Stack from "@mui/material/Stack";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { savePnlReportingBasis } from "./pnl-reporting-basis-actions";

export function PnlReportingBasisSettings({
  pnlReportingBasis,
}: {
  pnlReportingBasis: "gross" | "net";
}) {
  const router = useRouter();
  const [selection, setSelection] = useState(pnlReportingBasis);
  const [message, setMessage] = useState<string | null>(null);
  const [working, startTransition] = useTransition();

  function save(): void {
    startTransition(async () => {
      const result = await savePnlReportingBasis(selection);
      if (result.ok) {
        setSelection(result.pnlReportingBasis);
        setMessage("P/L preference saved.");
        router.refresh();
      } else {
        setMessage(result.message);
      }
    });
  }

  return (
    <Stack spacing={1.5}>
      {message ? <Alert severity={message === "P/L preference saved." ? "success" : "error"}>{message}</Alert> : null}
      <FormControl>
        <RadioGroup
          onChange={(event) => {
            setSelection(event.target.value as "gross" | "net");
            setMessage(null);
          }}
          value={selection}
        >
          <FormControlLabel control={<Radio />} label="I enter fees" value="net" />
          <FormControlLabel control={<Radio />} label="I don’t enter fees" value="gross" />
        </RadioGroup>
      </FormControl>
      <Button disabled={working || selection === pnlReportingBasis} onClick={save} sx={{ alignSelf: "flex-start" }} variant="contained">
        {working ? "Saving..." : "Save preference"}
      </Button>
    </Stack>
  );
}
