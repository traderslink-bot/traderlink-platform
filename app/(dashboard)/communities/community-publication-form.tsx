"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import { useRef, useState, useTransition, type ReactNode, type FormEvent } from "react";
import type { CommunityPublicationFeedback } from "@/src/modules/communities/contracts/community-publication-feedback";

export function CommunityPublicationForm({ action, children, disabled = false }: {
  action: (data: FormData) => Promise<CommunityPublicationFeedback>;
  children: ReactNode;
  disabled?: boolean;
}) {
  const [feedback, setFeedback] = useState<CommunityPublicationFeedback>({ status: "idle", message: "" });
  const [pending, startTransition] = useTransition();
  const submitting = useRef(false);
  const requestId = useRef<string | null>(null);
  const previousPayload = useRef("");
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (disabled || submitting.current) return;
    const native = event.nativeEvent as SubmitEvent;
    const data = new FormData(event.currentTarget, native.submitter);
    const payload = JSON.stringify([...data.entries()]);
    if (!requestId.current || previousPayload.current !== payload) requestId.current = crypto.randomUUID();
    previousPayload.current = payload;
    data.set("requestId", requestId.current);
    submitting.current = true;
    setFeedback({ status: "idle", message: data.get("status") === "published" || data.get("intent") === "publish" ? "Publishing…" : "Saving…" });
    startTransition(async () => {
      try { setFeedback(await action(data)); }
      catch { setFeedback({ status: "error", message: "We couldn't confirm the save. Your entries are still here. Retry without changing them to safely check the same request." }); }
      finally { submitting.current = false; }
    });
  }
  return <Box component="form" onSubmit={submit}>
    <Stack spacing={2}>
      {feedback.message ? <Alert role={feedback.status === "error" ? "alert" : "status"} severity={feedback.status === "error" ? "error" : feedback.status === "success" ? "success" : "info"}>
        {feedback.message}{feedback.href ? <Button component="a" href={feedback.href} size="small">View saved item</Button> : null}
      </Alert> : null}
      <Box component="fieldset" disabled={disabled || pending} sx={{ border: 0, p: 0, m: 0, minWidth: 0 }}>{children}</Box>
    </Stack>
  </Box>;
}
