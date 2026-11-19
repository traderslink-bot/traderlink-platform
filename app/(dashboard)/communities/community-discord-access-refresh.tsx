"use client";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { PLATFORM_MUTATION_REQUEST_HEADER } from "@/src/modules/platform/contracts/platform-request-security";

export function CommunityDiscordAccessRefresh() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [notice, setNotice] = useState<Readonly<{ message: string; success: boolean }> | null>(null);
  return <Stack spacing={1} sx={{ alignItems: "flex-start" }}>
    <Button disabled={pending} variant="outlined" onClick={() => {
      setNotice(null);
      startTransition(async () => {
        try {
          const response = await fetch("/api/communities/discord-access", {
            method: "POST",
            headers: { [PLATFORM_MUTATION_REQUEST_HEADER]: "1" },
          });
          const result = await response.json() as { message?: unknown };
          if (!response.ok) throw new Error(typeof result.message === "string" ? result.message : "Community access could not be refreshed.");
          setNotice({ message: typeof result.message === "string" ? result.message : "Community access refreshed.", success: true });
          router.refresh();
        } catch (error) {
          setNotice({ message: error instanceof Error ? error.message : "Community access could not be refreshed.", success: false });
        }
      });
    }}>{pending ? "Refreshing community access…" : "Refresh community access"}</Button>
    {notice ? <Alert severity={notice.success ? "success" : "warning"}>{notice.message}</Alert> : null}
  </Stack>;
}
