"use client";

import { useActionState, useRef, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";

export type MembershipActionState = { error: string | null; success: string | null };
export function MembershipForm({ action, children, label }: {
  action: (previous: MembershipActionState, form: FormData) => Promise<MembershipActionState>;
  children: ReactNode; label: string;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, submit, pending] = useActionState(async (previous: MembershipActionState, form: FormData) => {
    const result = await action(previous, form);
    if (!result.error) router.refresh();
    return result;
  }, { error: null, success: null });
  // React resets uncontrolled fields after a resolved action, including a
  // validation failure. Preserve the submitted controls until the owner changes them.
  return <Stack component="form" ref={formRef} action={submit} onReset={(event) => event.preventDefault()} spacing={2}>
    {children}
    {state.error ? <Alert severity="error" role="alert">{state.error}</Alert> : null}
    {state.success ? <Alert severity="success" role="status">{state.success}</Alert> : null}
    <Button type="submit" variant="contained" disabled={pending}>{pending ? "Saving..." : label}</Button>
  </Stack>;
}
