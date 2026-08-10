"use client";

import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import CircleRoundedIcon from "@mui/icons-material/CircleRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { useState } from "react";

import type { PlatformNotification } from "@/src/modules/platform/contracts/platform-notification-contracts";
import { markNotificationRead } from "./notification-actions";

function formatNotificationTime(occurredAtUtc: string) {
  const date = new Date(occurredAtUtc);
  return Number.isNaN(date.valueOf())
    ? ""
    : new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
}

export function NotificationList({
  compact = false,
  notifications,
}: {
  compact?: boolean;
  notifications: readonly PlatformNotification[];
}) {
  const [items, setItems] = useState(notifications);
  if (items.length === 0) {
    return (
      <Stack
        sx={{ alignItems: "center", minHeight: compact ? 150 : 220, justifyContent: "center", px: 2, textAlign: "center" }}
      >
        <Typography sx={{ fontWeight: 800 }}>You&apos;re all caught up</Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5 }} variant="body2">
          Updates about your imports, charts and reviews will appear here.
        </Typography>
      </Stack>
    );
  }

  return (
    <Stack divider={<Box sx={{ borderTop: 1, borderColor: "divider" }} />} spacing={0}>
      {items.map((notification) => {
        const content = (
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start", p: compact ? 1.5 : 2 }}>
            <Box sx={{ minWidth: 12, pt: 0.65 }}>
              {notification.readAtUtc === null ? <CircleRoundedIcon color="primary" sx={{ fontSize: 10 }} /> : null}
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontWeight: notification.readAtUtc === null ? 800 : 700 }} variant="body2">
                {notification.title}
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 0.25 }} variant="body2">
                {notification.summary}
              </Typography>
              <Typography color="text.secondary" sx={{ display: "block", mt: 0.75 }} variant="caption">
                {formatNotificationTime(notification.occurredAtUtc)}
              </Typography>
            </Box>
            {notification.destinationPath ? <ArrowForwardRoundedIcon color="action" sx={{ fontSize: 18, mt: 0.35 }} /> : null}
          </Stack>
        );
        return notification.destinationPath ? (
          <Button
            component={Link}
            href={notification.destinationPath}
            key={notification.notificationRef}
            onClick={() => {
              if (notification.readAtUtc !== null) return;
              setItems((current) => current.map((item) => item.notificationRef === notification.notificationRef
                ? Object.freeze({ ...item, readAtUtc: new Date().toISOString() })
                : item));
              void markNotificationRead(notification.notificationRef);
            }}
            sx={{ borderRadius: 0, color: "inherit", justifyContent: "stretch", p: 0, textAlign: "left", textTransform: "none" }}
          >
            {content}
          </Button>
        ) : <Box key={notification.notificationRef}>{content}</Box>;
      })}
    </Stack>
  );
}
