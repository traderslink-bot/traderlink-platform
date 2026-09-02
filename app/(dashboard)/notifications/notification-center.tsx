"use client";

import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";
import Badge from "@mui/material/Badge";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import type { PlatformNotification } from "@/src/modules/platform/contracts/platform-notification-contracts";
import { isNotificationDismissed } from "./notification-dismissal";
import { NotificationList } from "./notification-list";

export function NotificationCenter({
  notifications,
}: {
  notifications: readonly PlatformNotification[];
}) {
  const router = useRouter();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [dismissedNotificationRefs, setDismissedNotificationRefs] = useState<readonly string[]>([]);
  const [readNotificationRefs, setReadNotificationRefs] = useState<readonly string[]>([]);
  const visibleNotifications = notifications.map((notification) =>
    readNotificationRefs.includes(notification.notificationRef)
      ? Object.freeze({ ...notification, readAtUtc: notification.readAtUtc ?? new Date().toISOString() })
      : notification).filter((notification) =>
    !dismissedNotificationRefs.includes(notification.notificationRef) &&
    !isNotificationDismissed(notification.notificationRef));
  const unreadCount = visibleNotifications.filter((notification) => notification.readAtUtc === null).length;

  useEffect(() => {
    const refresh = () => router.refresh();
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [router]);

  return (
    <>
      <Tooltip title="Notifications">
        <IconButton
          aria-haspopup="menu"
          aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : "Notifications"}
          onClick={(event) => setAnchor(event.currentTarget)}
          sx={{ height: 44, width: 44 }}
        >
          <Badge badgeContent={unreadCount} color="error" max={99}>
            <NotificationsNoneRoundedIcon />
          </Badge>
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchor}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        keepMounted
        onClose={() => setAnchor(null)}
        open={Boolean(anchor)}
        slotProps={{ paper: { sx: { maxHeight: "calc(100dvh - 96px)", mt: 1, width: { xs: "calc(100vw - 32px)", sm: 400 } } } }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
      >
        <Box
          sx={{
            alignItems: { xs: "flex-start", sm: "center" },
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            gap: { xs: 0.5, sm: 1 },
            justifyContent: "space-between",
            px: 2,
            py: 1.5,
          }}
        >
          <Typography sx={{ fontWeight: 800 }}>Notifications</Typography>
          <Typography color="primary" component={Link} href="/notifications" onClick={() => setAnchor(null)} prefetch={false} sx={{ alignItems: "center", display: "inline-flex", fontSize: 14, fontWeight: 750, minHeight: 44, textDecoration: "none" }}>
            View all notifications
          </Typography>
        </Box>
        <NotificationList
          compact
          notifications={visibleNotifications.slice(0, 5)}
          onAllNotificationsRead={() => setReadNotificationRefs(
            visibleNotifications.map((notification) => notification.notificationRef),
          )}
          onNotificationDismissed={(notificationRef) => setDismissedNotificationRefs((current) =>
            current.includes(notificationRef) ? current : [...current, notificationRef])}
          onNotificationOpened={(notification) => {
            setAnchor(null);
            if (notification.destinationPath) router.push(notification.destinationPath);
          }}
          onNotificationRead={(notificationRef) => setReadNotificationRefs((current) =>
            current.includes(notificationRef) ? current : [...current, notificationRef])}
        />
      </Menu>
    </>
  );
}
