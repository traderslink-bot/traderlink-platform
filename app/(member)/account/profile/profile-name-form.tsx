"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { saveProfileName } from "./profile-name-actions";

export function ProfileNameForm({ initialName }: { initialName: string }) {
  const [name, setName] = useState(initialName);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return <Stack component="form" spacing={1.5} sx={{ mt: 2, maxWidth: 560 }}
    onSubmit={event => {
      event.preventDefault();
      setMessage(null);
      startTransition(async () => {
        try {
          const result = await saveProfileName(name);
          if (!result.ok) { setMessage({ ok: false, text: result.message }); return; }
          setName(result.displayName);
          setMessage({ ok: true, text: "Profile name saved." });
          router.refresh();
        } catch {
          setMessage({ ok: false, text: "Your profile name could not be saved. Try again." });
        }
      });
    }}>
    <TextField label="Profile name" value={name} disabled={pending}
      onChange={event => { setName(event.target.value); setMessage(null); }}
      slotProps={{ htmlInput: { maxLength: 120 } }}
      autoComplete="nickname"
      helperText="Choose a unique profile name. Once saved, Google and Discord won't change it." />
    <Button type="submit" variant="contained" disabled={pending || !name.trim()} sx={{ alignSelf: "flex-start" }}>
      {pending ? "Saving…" : "Save"}
    </Button>
    {message ? <Alert severity={message.ok ? "success" : "error"} role={message.ok ? "status" : "alert"}>
      {message.text}
    </Alert> : null}
  </Stack>;
}
