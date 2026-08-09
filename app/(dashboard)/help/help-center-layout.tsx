"use client";

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import HelpOutlineRoundedIcon from "@mui/icons-material/HelpOutlineRounded";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import RemoveRoundedIcon from "@mui/icons-material/RemoveRounded";
import TodayRoundedIcon from "@mui/icons-material/TodayRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";

import type { HelpNavigationItem } from "@/src/modules/help/help-content-registry";

function isCurrentHelpItem(pathname: string, href: string): boolean {
  return pathname === href;
}

function HelpNavigation({
  items,
  onNavigate,
  pathname,
}: {
  items: readonly HelpNavigationItem[];
  onNavigate?: () => void;
  pathname: string;
}) {
  const topLevelItems = items.filter((item) => item.depth !== 1);
  const childItemsByParent = new Map<string, readonly HelpNavigationItem[]>();
  let activeParentHref: string | null = null;
  for (const item of items) {
    if (item.depth !== 1) {
      activeParentHref = item.href;
      if (!childItemsByParent.has(item.href)) childItemsByParent.set(item.href, []);
      continue;
    }
    if (activeParentHref) {
      childItemsByParent.set(activeParentHref, [
        ...(childItemsByParent.get(activeParentHref) ?? []),
        item,
      ]);
    }
  }
  const currentCollectionHref = topLevelItems.find((item) =>
    item.href !== "/help" && pathname.startsWith(`${item.href}/`))?.href ??
    topLevelItems.find((item) => item.href !== "/help" && pathname === item.href)?.href ??
    null;
  const [collectionExpansionOverrides, setCollectionExpansionOverrides] = useState<
    ReadonlyMap<string, boolean>
  >(() => new Map());

  const setCollectionExpanded = (href: string, expanded: boolean) => {
    setCollectionExpansionOverrides((current) => {
      const next = new Map(current);
      next.set(href, expanded);
      return next;
    });
  };

  return (
    <Box component="nav" aria-label="Help guides">
      <Typography color="text.secondary" sx={{ fontWeight: 800, px: 1, pb: 0.75 }} variant="caption">
        Help guides
      </Typography>
      <List disablePadding>
        {topLevelItems.map((item) => {
          const selected = isCurrentHelpItem(pathname, item.href);
          const children = childItemsByParent.get(item.href) ?? [];
          const expandable = children.length > 0;
          const expanded = expandable && (
            collectionExpansionOverrides.get(item.href) ?? currentCollectionHref === item.href
          );
          const Icon = item.href === "/help" ? HomeRoundedIcon : TodayRoundedIcon;
          return (
            <Box key={item.href} sx={{ mb: 0.5 }}>
              <Box sx={{ alignItems: "stretch", display: "flex" }}>
                <ListItemButton
                  aria-current={selected ? "page" : undefined}
                  component={Link}
                  href={item.href}
                  onClick={() => {
                    if (expandable) setCollectionExpanded(item.href, true);
                    onNavigate?.();
                  }}
                  selected={selected}
                  sx={{
                    alignItems: "flex-start",
                    borderRadius: 1.5,
                    minHeight: 48,
                    minWidth: 0,
                    pl: 1,
                    pr: expandable ? 0.5 : 1,
                    "&.Mui-selected": {
                      bgcolor: "rgba(1, 30, 86, 0.08)",
                      color: "primary.main",
                      "&:hover": { bgcolor: "rgba(1, 30, 86, 0.11)" },
                      "& .MuiListItemIcon-root": { color: "primary.main" },
                    },
                  }}
                >
                  <ListItemIcon sx={{ color: "text.secondary", minWidth: 34, pt: 0.3 }}>
                    <Icon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    secondary={item.summary}
                    slotProps={{
                      primary: { sx: { fontSize: 14, fontWeight: 780, lineHeight: 1.3 } },
                      secondary: { sx: { fontSize: 12, lineHeight: 1.4, mt: 0.25 } },
                    }}
                  />
                </ListItemButton>
                {expandable ? (
                  <IconButton
                    aria-label={`${expanded ? "Collapse" : "Expand"} ${item.label} guides`}
                    aria-expanded={expanded}
                    onClick={() => setCollectionExpanded(item.href, !expanded)}
                    size="small"
                    sx={{ alignSelf: "center", ml: 0.25 }}
                  >
                    {expanded ? <RemoveRoundedIcon fontSize="small" /> : <AddRoundedIcon fontSize="small" />}
                  </IconButton>
                ) : null}
              </Box>
              {expandable ? (
                <Collapse in={expanded} timeout="auto" unmountOnExit>
                  <List disablePadding sx={{ mt: 0.5 }}>
                    {children.map((child) => {
                      const childSelected = isCurrentHelpItem(pathname, child.href);
                      return (
                        <ListItemButton
                          aria-current={childSelected ? "page" : undefined}
                          component={Link}
                          href={child.href}
                          key={child.href}
                          onClick={onNavigate}
                          selected={childSelected}
                          sx={{
                            borderRadius: 1.5,
                            minHeight: 42,
                            pl: 2.25,
                            pr: 1,
                            "&.Mui-selected": {
                              bgcolor: "rgba(1, 30, 86, 0.08)",
                              color: "primary.main",
                              "&:hover": { bgcolor: "rgba(1, 30, 86, 0.11)" },
                              "& .MuiListItemIcon-root": { color: "primary.main" },
                            },
                          }}
                        >
                          <ListItemIcon sx={{ color: "text.secondary", minWidth: 30 }}>
                            <ArticleOutlinedIcon fontSize="small" />
                          </ListItemIcon>
                          <ListItemText
                            primary={child.label}
                            slotProps={{
                              primary: { sx: { fontSize: 13.5, fontWeight: 740, lineHeight: 1.3 } },
                            }}
                          />
                        </ListItemButton>
                      );
                    })}
                  </List>
                </Collapse>
              ) : null}
            </Box>
          );
        })}
      </List>
    </Box>
  );
}

export function HelpCenterLayout({
  children,
  navigationItems,
}: {
  children: ReactNode;
  navigationItems: readonly HelpNavigationItem[];
}) {
  const pathname = usePathname();
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);

  return (
    <Stack spacing={2}>
      <Card sx={{ display: { xs: "block", md: "none" } }} variant="outlined">
        <CardContent sx={{ p: 1.25, "&:last-child": { pb: 1.25 } }}>
          <Button
            aria-controls="mobile-help-navigation"
            aria-expanded={mobileNavigationOpen}
            endIcon={mobileNavigationOpen ? <RemoveRoundedIcon /> : <AddRoundedIcon />}
            fullWidth
            onClick={() => setMobileNavigationOpen((current) => !current)}
            startIcon={<HelpOutlineRoundedIcon />}
            sx={{ justifyContent: "space-between" }}
            variant="outlined"
          >
            Browse help
          </Button>
          <Collapse in={mobileNavigationOpen} timeout="auto" unmountOnExit>
            <Box id="mobile-help-navigation" sx={{ pt: 1.25 }}>
              <HelpNavigation
                items={navigationItems}
                onNavigate={() => setMobileNavigationOpen(false)}
                pathname={pathname}
              />
            </Box>
          </Collapse>
        </CardContent>
      </Card>

      <Box
        sx={{
          alignItems: "start",
          display: "grid",
          gap: 2.5,
          gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "240px minmax(0, 1fr)" },
          minWidth: 0,
        }}
      >
        <Card
          component="aside"
          sx={{
            display: { xs: "none", md: "block" },
            maxHeight: "calc(100vh - 112px)",
            overflowY: "auto",
            position: "sticky",
            top: 88,
          }}
          variant="outlined"
        >
          <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
            <HelpNavigation items={navigationItems} pathname={pathname} />
          </CardContent>
        </Card>
        <Box sx={{ minWidth: 0 }}>{children}</Box>
      </Box>
    </Stack>
  );
}
