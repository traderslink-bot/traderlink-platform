"use client";

import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import CircleRoundedIcon from "@mui/icons-material/CircleRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";

import type { PlatformNotification } from "@/src/modules/platform/contracts/platform-notification-contracts";
import { markNotificationRead } from "./notification-actions";
import { dismissNotification, isNotificationDismissed } from "./notification-dismissal";

function subscribeToHydration(): () => void {
  return () => undefined;
}

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
  onNotificationDismissed,
  notifications,
}: {
  compact?: boolean;
  onNotificationDismissed?: (notificationRef: string) => void;
  notifications: readonly PlatformNotification[];
}) {
  const localTimeReady = useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false,
  );
  const [items, setItems] = useState(notifications);
  useEffect(() => {
    setItems(notifications.filter((notification) => !isNotificationDismissed(notification.notificationRef)));
  }, [notifications]);

  function markRead(notificationRef: string): void {
    setItems((current) => current.map((item) => item.notificationRef === notificationRef
      ? Object.freeze({ ...item, readAtUtc: new Date().toISOString() })
      : item));
    void markNotificationRead(notificationRef);
  }

  function dismiss(notificationRef: string): void {
    dismissNotification(notificationRef);
    setItems((current) => current.filter((item) => item.notificationRef !== notificationRef));
    onNotificationDismissed?.(notificationRef);
    void markNotificationRead(notificationRef);
  }
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
              <Typography sx={{ fontWeight: notification.readAtUtc === null ? 800 : 700, overflowWrap: "anywhere" }} variant="body2">
                {notification.title}
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 0.25, overflowWrap: "anywhere" }} variant="body2">
                {notification.summary}
              </Typography>
              <Typography color="text.secondary" sx={{ display: "block", mt: 0.75 }} variant="caption">
                {localTimeReady ? formatNotificationTime(notification.occurredAtUtc) : null}
              </Typography>
            </Box>
            {notification.destinationPath ? <ArrowForwardRoundedIcon color="action" sx={{ fontSize: 18, mt: 0.35 }} /> : null}
          </Stack>
        );
        return (
          <Stack direction="row" key={notification.notificationRef} sx={{ alignItems: "flex-start" }}>
            {notification.destinationPath ? (
              <Button
                component={Link}
                href={notification.destinationPath}
                onClick={() => {
                  if (notification.readAtUtc === null) markRead(notification.notificationRef);
                }}
                sx={{ borderRadius: 0, color: "inherit", flex: 1, justifyContent: "stretch", p: 0, textAlign: "left", textTransform: "none" }}
              >
                {content}
              </Button>
            ) : <Box sx={{ flex: 1 }}>{content}</Box>}
            <IconButton
              aria-label="Dismiss notification"
              onClick={() => dismiss(notification.notificationRef)}
              sx={{ height: 44, mr: compact ? 0.25 : 0.75, mt: compact ? 0.5 : 1, width: 44 }}
            >
              <CloseRoundedIcon fontSize="small" />
            </IconButton>
          </Stack>
        );
      })}
    </Stack>
  );
}
