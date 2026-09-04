"use client";

import AssessmentRoundedIcon from "@mui/icons-material/AssessmentRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import QueryStatsRoundedIcon from "@mui/icons-material/QueryStatsRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import FactCheckRoundedIcon from "@mui/icons-material/FactCheckRounded";
import FlagRoundedIcon from "@mui/icons-material/FlagRounded";
import GroupRoundedIcon from "@mui/icons-material/GroupRounded";
import HealthAndSafetyRoundedIcon from "@mui/icons-material/HealthAndSafetyRounded";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import ReportProblemRoundedIcon from "@mui/icons-material/ReportProblemRounded";
import SchemaRoundedIcon from "@mui/icons-material/SchemaRounded";
import AppBar from "@mui/material/AppBar";
import Badge from "@mui/material/Badge";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Stack from "@mui/material/Stack";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";

const drawerWidth = 270;

const navigation = [
  { href: "/admin/journal", label: "Overview", icon: <DashboardRoundedIcon /> },
  { href: "/admin/journal/users", label: "Users", icon: <GroupRoundedIcon /> },
  { href: "/admin/journal/imports", label: "Imports", icon: <CloudUploadRoundedIcon /> },
  { href: "/admin/journal/statement-formats", label: "Statement Formats", icon: <SchemaRoundedIcon /> },
  { href: "/admin/journal/data-decisions", label: "Data Decisions", icon: <FactCheckRoundedIcon /> },
  { href: "/admin/journal/levels", label: "Levels", icon: <InsightsRoundedIcon /> },
  { href: "/admin/journal/ai-reviews", label: "AI Reviews", icon: <AutoAwesomeRoundedIcon /> },
  { href: "/admin/journal/analyzer", label: "Trade Analyzer", icon: <QueryStatsRoundedIcon /> },
  { href: "/admin/journal/links-quality", label: "Links AI Chat", icon: <FlagRoundedIcon /> },
  { href: "/admin/journal/notifications", label: "Notifications", icon: <NotificationsNoneRoundedIcon /> },
  { href: "/admin/journal/system", label: "System", icon: <HealthAndSafetyRoundedIcon /> },
  { href: "/admin/journal/errors", label: "Errors", icon: <ReportProblemRoundedIcon /> },
  { href: "/admin/journal/audit", label: "Audit", icon: <AssessmentRoundedIcon /> },
] as const;

function active(pathname: string, href: string): boolean {
  if (href === "/admin/journal") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function title(pathname: string): string {
  return navigation.find((item) => active(pathname, item.href))?.label ??
    "Journal Administration";
}

function formatUtcTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  const hour = date.getUTCHours();
  const displayHour = hour % 12 || 12;
  const pad = (part: number) => part.toString().padStart(2, "0");
  return `${pad(date.getUTCMonth() + 1)}/${pad(date.getUTCDate())}/${date.getUTCFullYear()}, ${displayHour}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())} ${hour >= 12 ? "PM" : "AM"} UTC`;
}

export function JournalAdminShell({
  alertCount,
  children,
  dataAsOfUtc,
  environment,
  operatorRole,
}: {
  alertCount: number;
  children: ReactNode;
  dataAsOfUtc: string;
  environment: "Local" | "Preview" | "Production";
  operatorRole: string;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const drawer = (
    <Stack sx={{ height: "100%" }}>
      <Toolbar sx={{ minHeight: 72, px: 2 }}>
        <Link aria-label="TraderLink Journal Administration" href="/admin/journal">
          <Image
            alt="TraderLink"
            height={35}
            priority
            src="/logo-horizontal-main.png"
            style={{ display: "block", height: 35, objectFit: "contain", width: 170 }}
            width={170}
          />
        </Link>
      </Toolbar>
      <Box sx={{ px: 2, pb: 1.5 }}>
        <Typography color="primary.main" sx={{ fontWeight: 800 }} variant="caption">
          Journal Administration
        </Typography>
        <Typography color="text.secondary" variant="body2">
          Private owner access
        </Typography>
      </Box>
      <Divider />
      <List sx={{ flex: 1, px: 1, py: 1.5 }}>
        {navigation.map((item) => (
          <ListItemButton
            aria-current={active(pathname, item.href) ? "page" : undefined}
            component={Link}
            href={item.href}
            key={item.href}
            onClick={() => setMobileOpen(false)}
            selected={active(pathname, item.href)}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              minHeight: 44,
              "&.Mui-selected": {
                bgcolor: "primary.main",
                color: "primary.contrastText",
                "&:hover": { bgcolor: "primary.dark" },
                "& .MuiListItemIcon-root": { color: "inherit" },
              },
            }}
          >
            <ListItemIcon sx={{ color: "text.secondary", minWidth: 40 }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText
              primary={item.label}
              slotProps={{ primary: { sx: { fontSize: 14, fontWeight: 700 } } }}
            />
          </ListItemButton>
        ))}
      </List>
      <Divider />
      <Box sx={{ p: 1.5 }}>
        <ListItemButton
          component={Link}
          href="/workspace"
          sx={{ borderRadius: 2 }}
        >
          <ListItemIcon sx={{ minWidth: 40 }}><ChevronLeftRoundedIcon /></ListItemIcon>
          <ListItemText
            primary="Return to Journal"
            slotProps={{ primary: { sx: { fontSize: 14, fontWeight: 700 } } }}
          />
        </ListItemButton>
      </Box>
    </Stack>
  );

  return (
    <Box sx={{ bgcolor: "background.default", display: "flex", minHeight: "100vh" }}>
      <AppBar
        color="inherit"
        elevation={0}
        position="fixed"
        sx={{
          borderBottom: 1,
          borderColor: "divider",
          ml: { md: `${drawerWidth}px` },
          width: { md: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar sx={{ gap: 1.5, minHeight: 72 }}>
          <IconButton
            aria-label="Open administration navigation"
            onClick={() => setMobileOpen(true)}
            sx={{ display: { md: "none" } }}
          >
            <MenuRoundedIcon />
          </IconButton>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography component="div" noWrap sx={{ fontWeight: 800 }}>
              {title(pathname)}
            </Typography>
            <Typography color="text.secondary" noWrap variant="caption">
              Data as of {formatUtcTimestamp(dataAsOfUtc)}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <Chip label={environment} size="small" variant="outlined" />
            <Chip
              color="primary"
              label={operatorRole}
              size="small"
              sx={{ display: { xs: "none", sm: "inline-flex" } }}
            />
            <Badge badgeContent={alertCount} color="error" max={99}>
              <HealthAndSafetyRoundedIcon color={alertCount > 0 ? "error" : "disabled"} />
            </Badge>
          </Stack>
        </Toolbar>
      </AppBar>
      <Box component="nav" sx={{ flexShrink: { md: 0 }, width: { md: drawerWidth } }}>
        <Drawer
          ModalProps={{ keepMounted: true }}
          onClose={() => setMobileOpen(false)}
          open={mobileOpen}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth },
          }}
          variant="temporary"
        >
          {drawer}
        </Drawer>
        <Drawer
          open
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": {
              borderColor: "divider",
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
          variant="permanent"
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{ flex: 1, minWidth: 0, px: { xs: 2, sm: 3 }, py: 3, pt: "96px" }}
      >
        {children}
      </Box>
    </Box>
  );
}
