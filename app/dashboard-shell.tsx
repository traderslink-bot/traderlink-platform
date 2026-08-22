"use client";

import AnalyticsRoundedIcon from "@mui/icons-material/AnalyticsRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import CandlestickChartIcon from "@mui/icons-material/CandlestickChart";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import EventRepeatIcon from "@mui/icons-material/EventRepeat";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import GavelRoundedIcon from "@mui/icons-material/GavelRounded";
import HelpOutlineRoundedIcon from "@mui/icons-material/HelpOutlineRounded";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import MenuOpenRoundedIcon from "@mui/icons-material/MenuOpenRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import NoteAltRoundedIcon from "@mui/icons-material/NoteAltRounded";
import NewspaperRoundedIcon from "@mui/icons-material/NewspaperRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import QueryStatsRoundedIcon from "@mui/icons-material/QueryStatsRounded";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import ScienceRoundedIcon from "@mui/icons-material/ScienceRounded";
import ShowChartRoundedIcon from "@mui/icons-material/ShowChartRounded";
import SmartToyOutlinedIcon from "@mui/icons-material/SmartToyOutlined";
import SpaceDashboardRoundedIcon from "@mui/icons-material/SpaceDashboardRounded";
import SwapVertRoundedIcon from "@mui/icons-material/SwapVertRounded";
import TableRowsRoundedIcon from "@mui/icons-material/TableRowsRounded";
import TimelineRoundedIcon from "@mui/icons-material/TimelineRounded";
import TodayIcon from "@mui/icons-material/Today";
import TravelExploreRoundedIcon from "@mui/icons-material/TravelExploreRounded";
import ViewDayRoundedIcon from "@mui/icons-material/ViewDayRounded";
import WifiOffRoundedIcon from "@mui/icons-material/WifiOffRounded";
import Box from "@mui/material/Box";
import Badge from "@mui/material/Badge";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
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
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import type { PlatformNotification } from "@/src/modules/platform/contracts/platform-notification-contracts";
import {
  DASHBOARD_HOME_ITEM,
  DASHBOARD_NAVIGATION_HREFS,
  DASHBOARD_SIDEBAR_NAVIGATION_SECTIONS,
  dashboardHelpTarget,
  type DashboardNavigationGroup,
  type DashboardNavigationIconKey,
  type DashboardNavigationItem,
} from "./dashboard-navigation";
import { NotificationCenter } from "./(dashboard)/notifications/notification-center";
import {
  TRADERLINK_OPEN_AI_CHAT_EVENT,
  type TraderLinkOpenAiChatEventDetail,
} from "./ai-chat-drawer-events";
import type { CoachAiDailyCompanionContextSelector } from "@/src/modules/coach/contracts/ai-daily-companion-contracts";
import { PushNotificationSetupBanner } from "./pwa/push-notification-setup-banner";
import {
  PRESS_RELEASE_CHANNEL_DEFINITIONS,
  type PressReleaseUnreadCounts,
} from "@/src/modules/news/contracts/press-release-dashboard-contracts";
import { areTraderLinkPlatformAiFeaturesEnabled } from
  "@/src/modules/platform/contracts/platform-ai-launch-state";

const expandedWidth = 272;
const collapsedWidth = 76;
const desktopNavigationPreferenceKey = "traderlink:dashboard-navigation-collapsed";
const aiFeaturesEnabled = areTraderLinkPlatformAiFeaturesEnabled();
const AiChatClient = dynamic(() =>
  import("./(dashboard)/ai-chat/ai-chat-client").then((module) => module.AiChatClient));

function navigationIcon(icon: DashboardNavigationIconKey): ReactNode {
  const icons: Record<DashboardNavigationIconKey, ReactNode> = {
    account: <PersonRoundedIcon />,
    aiChat: <SmartToyOutlinedIcon />,
    aiReviews: <AutoAwesomeRoundedIcon />,
    analytics: <AnalyticsRoundedIcon />,
    calendar: <CalendarMonthRoundedIcon />,
    compareArrows: <CompareArrowsIcon />,
    tradingDay: <TodayIcon />,
    swing: <EventRepeatIcon />,
    roundTrips: <RestartAltIcon />,
    marketCharts: <CandlestickChartIcon />,
    data: <ViewDayRoundedIcon />,
    execution: <InsightsRoundedIcon />,
    help: <HelpOutlineRoundedIcon />,
    import: <CloudUploadRoundedIcon />,
    lab: <ScienceRoundedIcon />,
    manualEntry: <NoteAltRoundedIcon />,
    newspaper: <NewspaperRoundedIcon />,
    overview: <SpaceDashboardRoundedIcon />,
    reflection: <NoteAltRoundedIcon />,
    results: <QueryStatsRoundedIcon />,
    rules: <GavelRoundedIcon />,
    ticker: <FormatListBulletedIcon />,
    timing: <TimelineRoundedIcon />,
    tradeAnalysis: <ShowChartRoundedIcon />,
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

function pressReleaseUnreadCount(
  href: string,
  counts: PressReleaseUnreadCounts | null,
): number {
  const channel = PRESS_RELEASE_CHANNEL_DEFINITIONS.find(
    (definition) => definition.href === href,
  )?.channel;
  return channel ? counts?.[channel] ?? 0 : 0;
}

function NavigationLink({
  collapsed,
  grouped = false,
  offline,
  item,
  onNavigate,
  onOpenAiChat,
  pathname,
  unreadCount = 0,
}: {
  collapsed: boolean;
  grouped?: boolean;
  offline: boolean;
  item: DashboardNavigationItem;
  onNavigate: () => void;
  onOpenAiChat: () => void;
  pathname: string;
  unreadCount?: number;
}) {
  const opensAiChat = aiFeaturesEnabled && !offline && item.href === "/ai-chat";
  const link = (
    <ListItemButton
      aria-current={isActive(pathname, item.href) ? "page" : undefined}
      component={Link}
      href={item.href}
      onClick={(event) => {
        if (offline) {
          event.preventDefault();
          onNavigate();
          window.location.assign(item.href);
          return;
        }
        if (opensAiChat) {
          event.preventDefault();
          onOpenAiChat();
          return;
        }
        onNavigate();
      }}
      selected={isActive(pathname, item.href)}
      sx={{
        borderRadius: 2,
        minHeight: 44,
        mx: 1,
        my: 0.25,
        pl: collapsed ? 1.25 : item.depth === 2 ? 4.75 : item.depth === 1 ? 3 : grouped ? 2.75 : 1.5,
        pr: collapsed ? 1.25 : 1.5,
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
        {collapsed && unreadCount > 0 ? (
          <Badge badgeContent={unreadCount} color="error" max={99}>
            {navigationIcon(item.icon)}
          </Badge>
        ) : navigationIcon(item.icon)}
      </ListItemIcon>
      {collapsed ? null : (
        <ListItemText
          primary={(
            <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "space-between" }}>
              <span>{item.label}</span>
              {item.statusLabel ? (
                <Chip
                  color="primary"
                  label={item.statusLabel}
                  size="small"
                  sx={{ fontSize: 10, fontWeight: 800, height: 20 }}
                  variant="outlined"
                />
              ) : null}
              {unreadCount > 0 ? (
                <Box
                  component="span"
                  sx={{
                    bgcolor: "error.main",
                    borderRadius: 5,
                    color: "error.contrastText",
                    fontSize: 11,
                    fontWeight: 800,
                    lineHeight: "20px",
                    minWidth: 20,
                    px: 0.75,
                    textAlign: "center",
                  }}
                >
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Box>
              ) : null}
            </Stack>
          )}
          slotProps={{
            primary: {
              sx: {
                fontSize: item.depth === 2 ? 12.5 : grouped ? 13 : 14,
                fontWeight: item.depth === 1 ? 760 : 620,
              },
            },
          }}
        />
      )}
    </ListItemButton>
  );

  return collapsed ? (
    <Tooltip
      arrow
      placement="right"
      title={item.statusLabel ? `${item.label} — ${item.statusLabel}` : item.label}
    >
      {link}
    </Tooltip>
  ) : (
    link
  );
}

export function DashboardShell({
  children,
  notifications = [],
  offline = false,
  pressReleaseUnreadCounts = null,
}: {
  children: ReactNode;
  notifications?: readonly PlatformNotification[];
  offline?: boolean;
  pressReleaseUnreadCounts?: PressReleaseUnreadCounts | null;
}) {
  const pathname = usePathname();
  const pageHelpTarget = offline ? null : dashboardHelpTarget(pathname);
  const helpDestination = pageHelpTarget?.href ?? "/help";
  const helpLabel = pageHelpTarget
    ? `Help for ${pageHelpTarget.label}`
    : "Open Help Center";
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [aiChatContext, setAiChatContext] = useState<CoachAiDailyCompanionContextSelector | null>(null);
  const [aiChatSuggestedQuestion, setAiChatSuggestedQuestion] = useState<string | null>(null);
  const [aiChatContextRequestId, setAiChatContextRequestId] = useState(0);
  const [expandedGroups, setExpandedGroups] = useState<
    Readonly<Partial<Record<DashboardNavigationGroup["id"], boolean>>>
  >({});

  const desktopWidth = collapsed ? collapsedWidth : expandedWidth;
  const closeMobile = () => setMobileOpen(false);
  const setDesktopNavigationCollapsed = (nextCollapsed: boolean) => {
    setCollapsed(nextCollapsed);
    try {
      window.localStorage.setItem(
        desktopNavigationPreferenceKey,
        nextCollapsed ? "true" : "false",
      );
    } catch {
      // The navigation still works when device storage is unavailable.
    }
  };
  const openAiChat = () => {
    closeMobile();
    if (offline) return;
    setAiChatContext(null);
    setAiChatSuggestedQuestion(null);
    setAiChatContextRequestId((current) => current + 1);
    setAiChatOpen(true);
  };

  useEffect(() => {
    let restoreFrame: number | undefined;
    try {
      if (window.localStorage.getItem(desktopNavigationPreferenceKey) === "true") {
        restoreFrame = window.requestAnimationFrame(() => setCollapsed(true));
      }
    } catch {
      // Keep the default expanded state when device storage is unavailable.
    }
    return () => {
      if (restoreFrame !== undefined) {
        window.cancelAnimationFrame(restoreFrame);
      }
    };
  }, []);

  useEffect(() => {
    const openFromDashboard = (event: Event) => {
      const detail = (event as CustomEvent<TraderLinkOpenAiChatEventDetail>).detail;
      setAiChatContext(detail?.dailyContext ?? null);
      setAiChatSuggestedQuestion(detail?.suggestedQuestion ?? null);
      setAiChatContextRequestId((current) => current + 1);
      setMobileOpen(false);
      setAiChatOpen(true);
    };
    window.addEventListener(TRADERLINK_OPEN_AI_CHAT_EVENT, openFromDashboard);
    return () => window.removeEventListener(TRADERLINK_OPEN_AI_CHAT_EVENT, openFromDashboard);
  }, []);

  const navigation = (mobile: boolean) => {
    const compact = mobile ? false : collapsed;
    return (
      <Stack sx={{ height: "100%" }}>
        {mobile ? (
          <>
            <Toolbar
              disableGutters
              sx={{
                justifyContent: "space-between",
                minHeight: 72,
                px: 2,
              }}
            >
              <Link
                aria-label="TradersLink workspace"
                href="/workspace"
                onClick={closeMobile}
              >
                <Image
                  alt="TradersLink"
                  height={35}
                  priority
                  src="/logo-horizontal-main.png"
                  style={{
                    display: "block",
                    height: 35,
                    objectFit: "contain",
                    width: "auto",
                  }}
                  unoptimized
                  width={170}
                />
              </Link>
              <Tooltip title="Close navigation">
                <IconButton
                  aria-label="Close navigation"
                  onClick={closeMobile}
                  sx={{ minHeight: 44, minWidth: 44 }}
                >
                  <CloseRoundedIcon />
                </IconButton>
              </Tooltip>
            </Toolbar>
            <Divider />
          </>
        ) : null}
        <Box
          component="nav"
          id={
            mobile ? "dashboard-mobile-navigation" : "dashboard-desktop-navigation"
          }
          sx={{ flexGrow: 1, overflowY: "auto", py: 1.25 }}
        >
          <List disablePadding>
            <NavigationLink
              collapsed={compact}
              offline={offline}
              item={DASHBOARD_HOME_ITEM}
              onNavigate={closeMobile}
              onOpenAiChat={openAiChat}
              pathname={pathname}
            />
            {DASHBOARD_SIDEBAR_NAVIGATION_SECTIONS.map((section, sectionIndex) => {
              const divider = section.dividerBefore ? (
                <Divider sx={{ my: 1.25 }} />
              ) : compact && sectionIndex > 0 ? (
                <Divider sx={{ mx: 2, my: 0.75 }} />
              ) : null;

              if (section.kind === "item") {
                return (
                  <Box key={section.item.href}>
                    {divider}
                    <NavigationLink
                      collapsed={compact}
                      offline={offline}
                      item={section.item}
                      onNavigate={closeMobile}
                      onOpenAiChat={openAiChat}
                      pathname={pathname}
                    />
                  </Box>
                );
              }

              const { group } = section;
              const open = expandedGroups[group.id] ?? group.items.some((item) =>
                isActive(pathname, item.href));
              const groupUnreadCount = group.id === "pressReleases"
                ? pressReleaseUnreadCounts?.all ?? 0
                : 0;
              return (
                <Box
                  key={group.id}
                  sx={compact ? undefined : {
                    borderBottom: "1px solid #aeb8c7",
                    borderTop: "1px solid #aeb8c7",
                    my: 1,
                    py: 0.5,
                  }}
                >
                  {divider}
                  {compact ? null : (
                    <ListItemButton
                      aria-expanded={open}
                      onClick={() =>
                        setExpandedGroups((current) => ({
                          ...current,
                          [group.id]: !current[group.id],
                        }))
                      }
                      sx={{ borderRadius: 2, minHeight: 42, mx: 1, mt: 0.25 }}
                    >
                      <ListItemIcon sx={{ minWidth: 38 }}>
                        {navigationIcon(group.icon)}
                      </ListItemIcon>
                      <ListItemText
                        primary={(
                          <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "space-between" }}>
                            <span>{group.label}</span>
                            {groupUnreadCount > 0 ? (
                              <Box
                                component="span"
                                sx={{
                                  bgcolor: "error.main",
                                  borderRadius: 5,
                                  color: "error.contrastText",
                                  fontSize: 11,
                                  fontWeight: 800,
                                  lineHeight: "20px",
                                  minWidth: 20,
                                  px: 0.75,
                                  textAlign: "center",
                                }}
                              >
                                {groupUnreadCount > 99 ? "99+" : groupUnreadCount}
                              </Box>
                            ) : null}
                          </Stack>
                        )}
                        slotProps={{
                          primary: {
                            sx: { fontSize: 14.5, fontWeight: 820 },
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
                    <List
                      disablePadding
                      sx={compact ? undefined : {
                        borderLeft: "2px solid #d4dae3",
                        ml: 2.5,
                        mr: 0.5,
                      }}
                    >
                      {group.items.map((item) => (
                        <NavigationLink
                          collapsed={compact}
                          grouped
                          offline={offline}
                          item={item}
                          key={item.href}
                          onNavigate={closeMobile}
                          onOpenAiChat={openAiChat}
                          pathname={pathname}
                          unreadCount={pressReleaseUnreadCount(
                            item.href,
                            pressReleaseUnreadCounts,
                          )}
                        />
                      ))}
                    </List>
                  </Collapse>
                </Box>
              );
            })}
          </List>
        </Box>
        {compact ? null : (
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography color="text.secondary" variant="caption">
              Trade Tracker
            </Typography>
          </Box>
        )}
      </Stack>
    );
  };

  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100vh" }}>
      <Box
        component="header"
        sx={{
          bgcolor: "background.paper",
          borderBottom: 1,
          borderColor: "divider",
          left: 0,
          position: "fixed",
          right: 0,
          top: 0,
          zIndex: (theme) => theme.zIndex.appBar,
        }}
      >
        <Toolbar
          sx={{
            gap: { xs: 0.5, sm: 1.5 },
            minHeight: {
              xs: "calc(64px + env(safe-area-inset-top))",
              sm: 64,
            },
            pt: { xs: "env(safe-area-inset-top)", sm: 0 },
            px: { xs: 1.5, sm: 2.5 },
            "& .MuiIconButton-root": {
              flexShrink: 0,
              minHeight: 44,
              minWidth: 44,
            },
            "& .MuiInputBase-root": { minHeight: 44 },
          }}
        >
          <IconButton
            aria-label="Open navigation"
            onClick={() => setMobileOpen(true)}
            sx={{ display: { lg: "none" } }}
          >
            <MenuRoundedIcon />
          </IconButton>
          <Tooltip title="Toggle sidebar">
            <IconButton
              aria-controls="dashboard-desktop-navigation"
              aria-expanded={!collapsed}
              aria-label="Toggle sidebar"
              onClick={() => setDesktopNavigationCollapsed(!collapsed)}
              sx={{ display: { xs: "none", lg: "inline-flex" } }}
            >
              {collapsed ? <MenuRoundedIcon /> : <MenuOpenRoundedIcon />}
            </IconButton>
          </Tooltip>
          <Box sx={{ display: { xs: "none", lg: "block" }, flexShrink: 0 }}>
            <Link aria-label="TradersLink workspace" href="/workspace">
              <Image
                alt="TradersLink"
                height={35}
                priority
                src="/logo-horizontal-main.png"
                style={{
                  display: "block",
                  height: 35,
                  objectFit: "contain",
                  width: "auto",
                }}
                unoptimized
                width={170}
              />
            </Link>
          </Box>
          {offline ? (
            <Chip
              icon={<WifiOffRoundedIcon />}
              label="Offline"
              size="small"
              sx={{ flexShrink: 0 }}
              variant="outlined"
            />
          ) : null}
          <Box sx={{ flexGrow: 1 }} />
          <Button
            aria-controls={aiFeaturesEnabled && aiChatOpen ? "ai-chat-drawer" : undefined}
            aria-expanded={aiFeaturesEnabled ? aiChatOpen : undefined}
            aria-haspopup={aiFeaturesEnabled ? "dialog" : undefined}
            aria-label={aiFeaturesEnabled
              ? offline ? "Links AI Chat requires an internet connection" : "Open Links AI Chat"
              : "AI features coming soon"}
            component={aiFeaturesEnabled ? "button" : Link}
            disabled={aiFeaturesEnabled && offline}
            href={aiFeaturesEnabled ? undefined : "/ai-chat"}
            onClick={aiFeaturesEnabled ? openAiChat : undefined}
            startIcon={(
              <Box
                component="span"
                sx={{
                  alignItems: "center",
                  bgcolor: "primary.main",
                  borderRadius: 1,
                  color: "primary.contrastText",
                  display: "inline-flex",
                  height: 24,
                  justifyContent: "center",
                  width: 24,
                }}
              >
                <SmartToyOutlinedIcon sx={{ fontSize: 18 }} />
              </Box>
            )}
            sx={{
              bgcolor: "background.paper",
              borderColor: "primary.main",
              color: "primary.main",
              flexShrink: 0,
              fontWeight: 800,
              minHeight: 44,
              minWidth: 56,
              px: 0.5,
              whiteSpace: "nowrap",
              "& .MuiButton-startIcon": {
                ml: 0,
                mr: 0.25,
              },
              "&:hover": {
                bgcolor: "rgba(1, 30, 86, 0.04)",
                borderColor: "primary.dark",
              },
            }}
            variant="outlined"
          >
            AI
          </Button>
          <NotificationCenter notifications={notifications} />
          <Tooltip title={helpLabel}>
            <IconButton
              aria-label={helpLabel}
              component={Link}
              href={helpDestination}
              sx={{
                color: "primary.main",
                "&:hover": { bgcolor: "rgba(1, 30, 86, 0.04)" },
              }}
            >
              <HelpOutlineRoundedIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Account">
            <IconButton
              aria-label="Open Account"
              component={Link}
              href="/account"
              sx={{
                color: "primary.main",
                "&:hover": { bgcolor: "rgba(1, 30, 86, 0.04)" },
              }}
            >
              <PersonRoundedIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </Box>
      <Drawer
        ModalProps={{ keepMounted: true }}
        onClose={closeMobile}
        open={mobileOpen}
        sx={{
          display: { xs: "block", lg: "none" },
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            pb: "env(safe-area-inset-bottom)",
            pt: "env(safe-area-inset-top)",
            width: expandedWidth,
          },
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
            height: "calc(100% - 64px)",
            overflowX: "hidden",
            top: 64,
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
          pt: {
            xs: "calc(64px + env(safe-area-inset-top))",
            sm: "64px",
          },
          transition: (theme) =>
            theme.transitions.create("margin-left", {
              duration: theme.transitions.duration.shorter,
            }),
        }}
      >
        <Box
          component="main"
          sx={{
            minWidth: 0,
            pb: { xs: "max(16px, env(safe-area-inset-bottom))", sm: 2.5 },
            position: "relative",
            px: { xs: 1.5, sm: 2.5, xl: 3 },
            pt: { xs: 2, sm: 2.5 },
            width: "100%",
          }}
        >
          <PushNotificationSetupBanner
            enabled={!offline}
            pathname={pathname}
          />
          {children}
        </Box>
      </Box>
      {offline || !aiFeaturesEnabled ? null : (
        <Drawer
          anchor="right"
          onClose={() => {
            setAiChatContext(null);
            setAiChatSuggestedQuestion(null);
            setAiChatContextRequestId((current) => current + 1);
            setAiChatOpen(false);
          }}
          open={aiChatOpen}
          sx={{ overflowX: "hidden" }}
          slotProps={{
            paper: {
              id: "ai-chat-drawer",
              sx: {
                boxSizing: "border-box",
                height: "100dvh",
                maxWidth: "100%",
                pb: { xs: "env(safe-area-inset-bottom)", md: 0 },
                pt: { xs: "env(safe-area-inset-top)", md: 0 },
                width: {
                  xs: "100%",
                  md: "min(860px, calc(100vw - 80px))",
                  xl: 960,
                },
              },
            },
          }}
          variant="temporary"
        >
          {aiChatOpen ? (
            <AiChatClient
              contextRequestId={aiChatContextRequestId}
              initialContext={aiChatContext}
              initialQuestion={aiChatSuggestedQuestion}
              onClose={() => {
                setAiChatContext(null);
                setAiChatSuggestedQuestion(null);
                setAiChatContextRequestId((current) => current + 1);
                setAiChatOpen(false);
              }}
              presentation="drawer"
            />
          ) : null}
        </Drawer>
      )}
    </Box>
  );
}
