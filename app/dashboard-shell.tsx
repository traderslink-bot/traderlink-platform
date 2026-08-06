"use client";

import AnalyticsRoundedIcon from "@mui/icons-material/AnalyticsRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import ChatRoundedIcon from "@mui/icons-material/ChatRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import CandlestickChartIcon from "@mui/icons-material/CandlestickChart";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import EventRepeatIcon from "@mui/icons-material/EventRepeat";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import GavelRoundedIcon from "@mui/icons-material/GavelRounded";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import NoteAltRoundedIcon from "@mui/icons-material/NoteAltRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import QueryStatsRoundedIcon from "@mui/icons-material/QueryStatsRounded";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import ScienceRoundedIcon from "@mui/icons-material/ScienceRounded";
import ShowChartRoundedIcon from "@mui/icons-material/ShowChartRounded";
import SpaceDashboardRoundedIcon from "@mui/icons-material/SpaceDashboardRounded";
import SwapVertRoundedIcon from "@mui/icons-material/SwapVertRounded";
import TableRowsRoundedIcon from "@mui/icons-material/TableRowsRounded";
import TimelineRoundedIcon from "@mui/icons-material/TimelineRounded";
import TodayIcon from "@mui/icons-material/Today";
import TravelExploreRoundedIcon from "@mui/icons-material/TravelExploreRounded";
import ViewDayRoundedIcon from "@mui/icons-material/ViewDayRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Collapse from "@mui/material/Collapse";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Stack from "@mui/material/Stack";
import Toolbar from "@mui/material/Toolbar";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";

import {
  DASHBOARD_DATA_NAVIGATION_GROUP,
  DASHBOARD_HOME_ITEM,
  DASHBOARD_MAIN_NAVIGATION_GROUPS,
  DASHBOARD_NAVIGATION_HREFS,
  DASHBOARD_ROUTE_TITLES,
  DASHBOARD_STANDALONE_ITEMS,
  type DashboardNavigationGroup,
  type DashboardNavigationIconKey,
  type DashboardNavigationItem,
} from "./dashboard-navigation";
import {
  DashboardAccountSwitcher,
  type DashboardJournalAccountOption,
} from "./dashboard-account-switcher";

const expandedWidth = 272;
const collapsedWidth = 76;

function navigationIcon(icon: DashboardNavigationIconKey): ReactNode {
  const icons: Record<DashboardNavigationIconKey, ReactNode> = {
    account: <PersonRoundedIcon />,
    aiChat: <ChatRoundedIcon />,
    aiReviews: <AutoAwesomeRoundedIcon />,
    analytics: <AnalyticsRoundedIcon />,
    calendar: <CalendarMonthRoundedIcon />,
    tradingDay: <TodayIcon />,
    swing: <EventRepeatIcon />,
    roundTrips: <RestartAltIcon />,
    marketCharts: <CandlestickChartIcon />,
    data: <ViewDayRoundedIcon />,
    execution: <InsightsRoundedIcon />,
    import: <CloudUploadRoundedIcon />,
    lab: <ScienceRoundedIcon />,
    manualEntry: <NoteAltRoundedIcon />,
    overview: <SpaceDashboardRoundedIcon />,
    performance: <ShowChartRoundedIcon />,
    reflection: <NoteAltRoundedIcon />,
    results: <QueryStatsRoundedIcon />,
    rules: <GavelRoundedIcon />,
    ticker: <FormatListBulletedIcon />,
    timing: <TimelineRoundedIcon />,
    tradeExplorer: <TravelExploreRoundedIcon />,
    tradeGroup: <SwapVertRoundedIcon />,
    trades: <TableRowsRoundedIcon />,
    workspace: <DashboardRoundedIcon />,
  };
  return icons[icon];
}

function isActive(pathname: string, href: string): boolean {
  const activeHref = DASHBOARD_NAVIGATION_HREFS
    .filter((candidate) =>
      pathname === candidate || pathname.startsWith(`${candidate}/`))
    .sort((left, right) => right.length - left.length)[0];
  return activeHref === href;
}

function pageTitle(pathname: string): string {
  const exact = DASHBOARD_ROUTE_TITLES[pathname];
  if (exact) {
    return exact;
  }
  const match = Object.entries(DASHBOARD_ROUTE_TITLES)
    .sort(([left], [right]) => right.length - left.length)
    .find(([href]) => pathname.startsWith(`${href}/`));
  return match?.[1] ?? "Trader Intelligence";
}

function NavigationLink({
  badgeCount = 0,
  collapsed,
  item,
  onNavigate,
  pathname,
}: {
  badgeCount?: number;
  collapsed: boolean;
  item: DashboardNavigationItem;
  onNavigate: () => void;
  pathname: string;
}) {
  const link = (
    <ListItemButton
      aria-current={isActive(pathname, item.href) ? "page" : undefined}
      component={Link}
      href={item.href}
      onClick={onNavigate}
      selected={isActive(pathname, item.href)}
      sx={{
        borderRadius: 2,
        minHeight: 44,
        mx: 1,
        my: 0.25,
        px: collapsed ? 1.25 : 1.5,
        justifyContent: collapsed ? "center" : "initial",
        "&.Mui-selected": {
          bgcolor: "primary.main",
          color: "primary.contrastText",
          "&:hover": { bgcolor: "primary.dark" },
          "& .MuiListItemIcon-root": { color: "inherit" },
        },
      }}
    >
      <ListItemIcon
        sx={{
          color: "text.secondary",
          minWidth: collapsed ? 0 : 38,
          justifyContent: "center",
        }}
      >
        {navigationIcon(item.icon)}
      </ListItemIcon>
      {collapsed ? null : (
        <ListItemText
          primary={item.label}
          slotProps={{
            primary: { sx: { fontSize: 14, fontWeight: 620 } },
          }}
        />
      )}
      {badgeCount > 0 ? (
        <Box
          aria-label={`${badgeCount} unresolved data decision${badgeCount === 1 ? "" : "s"}`}
          sx={{
            alignItems: "center",
            bgcolor: "warning.main",
            borderRadius: "999px",
            color: "warning.contrastText",
            display: "flex",
            fontSize: 12,
            fontWeight: 800,
            height: 20,
            justifyContent: "center",
            minWidth: 20,
            px: 0.75,
          }}
        >
          {badgeCount}
        </Box>
      ) : null}
    </ListItemButton>
  );

  return collapsed ? (
    <Tooltip arrow placement="right" title={item.label}>
      {link}
    </Tooltip>
  ) : (
    link
  );
}

export function DashboardShell({
  children,
  journalAccounts,
  pendingDataDecisionCount,
}: {
  children: ReactNode;
  journalAccounts: readonly DashboardJournalAccountOption[];
  pendingDataDecisionCount: number;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<
    Readonly<Record<DashboardNavigationGroup["id"], boolean>>
  >({
    trades: pathname.startsWith("/trades"),
    analytics: pathname.startsWith("/analytics"),
    data: pathname === "/imports" || pathname === "/manual-entry",
  });

  const desktopWidth = collapsed ? collapsedWidth : expandedWidth;
  const closeMobile = () => setMobileOpen(false);

  const navigation = (mobile: boolean) => {
    const compact = mobile ? false : collapsed;
    return (
      <Stack sx={{ height: "100%" }}>
        <Toolbar
          disableGutters
          sx={{
            minHeight: 72,
            px: compact ? 1.5 : 2,
            justifyContent: compact ? "center" : "space-between",
          }}
        >
          <Link
            aria-label="TradersLink workspace"
            href="/workspace"
            onClick={closeMobile}
          >
            <Image
              alt="TradersLink"
              height={compact ? 44 : 35}
              priority
              src={compact ? "/icon.png" : "/logo-horizontal-main.png"}
              style={{
                display: "block",
                height: compact ? 44 : 35,
                objectFit: "contain",
                width: compact ? 44 : 170,
              }}
              width={compact ? 44 : 170}
            />
          </Link>
          {compact || mobile ? null : (
            <Tooltip title="Collapse navigation">
              <IconButton
                aria-label="Collapse navigation"
                onClick={() => setCollapsed(true)}
                size="small"
              >
                <ChevronLeftRoundedIcon />
              </IconButton>
            </Tooltip>
          )}
        </Toolbar>
        <Divider />
        <Box component="nav" sx={{ flexGrow: 1, overflowY: "auto", py: 1.25 }}>
          <List disablePadding>
            <NavigationLink
              collapsed={compact}
              item={DASHBOARD_HOME_ITEM}
              onNavigate={closeMobile}
              pathname={pathname}
            />
            {DASHBOARD_MAIN_NAVIGATION_GROUPS.map((group) => {
              const open = expandedGroups[group.id] || group.items.some((item) =>
                isActive(pathname, item.href));
              return (
                <Box key={group.id}>
                  {compact ? null : (
                    <ListItemButton
                      aria-expanded={open}
                      onClick={() =>
                        setExpandedGroups((current) => ({
                          ...current,
                          [group.id]: !current[group.id],
                        }))
                      }
                      sx={{ borderRadius: 2, minHeight: 40, mx: 1, mt: 0.75 }}
                    >
                      <ListItemIcon sx={{ minWidth: 38 }}>
                        {navigationIcon(group.icon)}
                      </ListItemIcon>
                      <ListItemText
                        primary={group.label}
                        slotProps={{
                          primary: {
                            sx: { fontSize: 13, fontWeight: 720 },
                          },
                        }}
                      />
                      {open ? (
                        <ExpandLessRoundedIcon fontSize="small" />
                      ) : (
                        <ExpandMoreRoundedIcon fontSize="small" />
                      )}
                    </ListItemButton>
                  )}
                  <Collapse in={compact || open} timeout="auto" unmountOnExit>
                    <List disablePadding>
                      {group.items.map((item) => (
                        <NavigationLink
                          collapsed={compact}
                          item={item}
                          key={item.href}
                          onNavigate={closeMobile}
                          pathname={pathname}
                        />
                      ))}
                    </List>
                  </Collapse>
                </Box>
              );
            })}
            <Divider sx={{ my: 1.25 }} />
            {DASHBOARD_STANDALONE_ITEMS.map((item) => (
              <NavigationLink
                collapsed={compact}
                item={item}
                key={item.href}
                onNavigate={closeMobile}
                pathname={pathname}
              />
            ))}
            {[DASHBOARD_DATA_NAVIGATION_GROUP].map((group) => {
              const open = expandedGroups[group.id] || group.items.some((item) =>
                isActive(pathname, item.href));
              return (
                <Box key={group.id}>
                  {compact ? null : (
                    <ListItemButton
                      aria-expanded={open}
                      onClick={() =>
                        setExpandedGroups((current) => ({
                          ...current,
                          [group.id]: !current[group.id],
                        }))
                      }
                      sx={{ borderRadius: 2, minHeight: 40, mx: 1, mt: 0.75 }}
                    >
                      <ListItemIcon sx={{ minWidth: 38 }}>
                        {navigationIcon(group.icon)}
                      </ListItemIcon>
                      <ListItemText
                        primary={group.label}
                        slotProps={{
                          primary: {
                            sx: { fontSize: 13, fontWeight: 720 },
                          },
                        }}
                      />
                      {open ? (
                        <ExpandLessRoundedIcon fontSize="small" />
                      ) : (
                        <ExpandMoreRoundedIcon fontSize="small" />
                      )}
                    </ListItemButton>
                  )}
                  <Collapse in={compact || open} timeout="auto" unmountOnExit>
                    <List disablePadding>
                      {group.items.map((item) => (
                        <NavigationLink
                          badgeCount={item.href === "/data-decisions" ? pendingDataDecisionCount : 0}
                          collapsed={compact}
                          item={item}
                          key={item.href}
                          onNavigate={closeMobile}
                          pathname={pathname}
                        />
                      ))}
                    </List>
                  </Collapse>
                </Box>
              );
            })}
          </List>
        </Box>
        {compact ? (
          <Box sx={{ p: 1.25 }}>
            <Tooltip arrow placement="right" title="Expand navigation">
              <IconButton
                aria-label="Expand navigation"
                onClick={() => setCollapsed(false)}
                sx={{ width: "100%" }}
              >
                <ChevronRightRoundedIcon />
              </IconButton>
            </Tooltip>
          </Box>
        ) : (
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography color="text.secondary" variant="caption">
              TraderLink Platform
            </Typography>
          </Box>
        )}
      </Stack>
    );
  };

  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100vh" }}>
      <Drawer
        ModalProps={{ keepMounted: true }}
        onClose={closeMobile}
        open={mobileOpen}
        sx={{
          display: { xs: "block", lg: "none" },
          "& .MuiDrawer-paper": { width: expandedWidth },
        }}
        variant="temporary"
      >
        {navigation(true)}
      </Drawer>
      <Drawer
        open
        sx={{
          display: { xs: "none", lg: "block" },
          width: desktopWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            borderRightColor: "divider",
            boxSizing: "border-box",
            overflowX: "hidden",
            transition: (theme) =>
              theme.transitions.create("width", {
                duration: theme.transitions.duration.shorter,
              }),
            width: desktopWidth,
          },
        }}
        variant="permanent"
      >
        {navigation(false)}
      </Drawer>
      <Box
        sx={{
          ml: { xs: 0, lg: `${desktopWidth}px` },
          minWidth: 0,
          transition: (theme) =>
            theme.transitions.create("margin-left", {
              duration: theme.transitions.duration.shorter,
            }),
        }}
      >
        <Box
          component="header"
          sx={{
            bgcolor: "background.paper",
            borderBottom: 1,
            borderColor: "divider",
            position: "sticky",
            top: 0,
            zIndex: (theme) => theme.zIndex.appBar,
          }}
        >
          <Toolbar sx={{ gap: 1.5, minHeight: 64, px: { xs: 1.5, sm: 2.5 } }}>
            <IconButton
              aria-label="Open navigation"
              onClick={() => setMobileOpen(true)}
              sx={{ display: { lg: "none" } }}
            >
              <MenuRoundedIcon />
            </IconButton>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                color="text.secondary"
                component="div"
                noWrap
                variant="caption"
              >
                Trader Intelligence
              </Typography>
              <Typography
                component="h1"
                noWrap
                sx={{ fontWeight: 720 }}
                variant="h6"
              >
                {pageTitle(pathname)}
              </Typography>
            </Box>
            <Box sx={{ flexGrow: 1 }} />
            <DashboardAccountSwitcher accounts={journalAccounts} />
            <Button
              component={Link}
              href="/imports"
              startIcon={<CloudUploadRoundedIcon />}
              sx={{
                color: "common.white",
                display: { xs: "none", sm: "inline-flex" },
                flexShrink: 0,
                whiteSpace: "nowrap",
              }}
              variant="contained"
            >
              Import trades
            </Button>
          </Toolbar>
        </Box>
        <Box
          component="main"
          sx={{
            minWidth: 0,
            px: { xs: 1.5, sm: 2.5, xl: 3 },
            py: { xs: 2, sm: 2.5 },
            width: "100%",
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}
