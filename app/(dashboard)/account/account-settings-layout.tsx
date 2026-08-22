"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import type { ReactNode } from "react";

import { DashboardPage, DashboardPanel } from "../../dashboard-template";
import { areTraderLinkPlatformAiFeaturesEnabled } from
  "@/src/modules/platform/contracts/platform-ai-launch-state";

const aiFeaturesEnabled = areTraderLinkPlatformAiFeaturesEnabled();

export type AccountSettingsSection =
  | "preferences"
  | "trading"
  | "ai"
  | "profile"
  | "privacy";

const ACCOUNT_SETTINGS_SECTIONS: readonly Readonly<{
  description: string;
  href: string;
  id: AccountSettingsSection;
  label: string;
}>[] = Object.freeze([
  Object.freeze({
    description: "Accounts, currency, broker connections, PWA app settings",
    href: "/account/trading",
    id: "trading",
    label: "General",
  }),
  Object.freeze({
    description: "Push notifications and Discord messages",
    href: "/account/preferences",
    id: "preferences",
    label: "Notifications",
  }),
  Object.freeze({
    description: aiFeaturesEnabled ? "AI Reviews and your plan" : "AI features are coming soon",
    href: "/account/ai",
    id: "ai",
    label: aiFeaturesEnabled ? "AI & plan" : "AI",
  }),
  Object.freeze({
    description: "Profile and sign-in",
    href: "/account/profile",
    id: "profile",
    label: "Profile",
  }),
  Object.freeze({
    description: "Permanent data deletion",
    href: "/account/privacy",
    id: "privacy",
    label: "Delete Account",
  }),
]);

export function AccountSettingsLayout({
  activeSection,
  children,
  description,
  title,
}: {
  activeSection: AccountSettingsSection;
  children: ReactNode;
  description: string;
  title: string;
}) {
  return (
    <DashboardPage>
      <Box>
        <Typography color="primary.main" sx={{ fontWeight: 800 }} variant="caption">
          Account Settings
        </Typography>
        <Typography component="h1" sx={{ mt: 0.5 }} variant="h1">{title}</Typography>
        <Typography color="text.secondary" sx={{ maxWidth: 760, mt: 1 }} variant="body2">
          {description}
        </Typography>
      </Box>

      <Box sx={{ alignItems: "start", display: "grid", gap: 2.5, gridTemplateColumns: { xs: "1fr", md: "220px minmax(0, 1fr)" } }}>
        <DashboardPanel hideHeader>
          <Stack component="nav" spacing={0.5} aria-label="Account settings">
            {ACCOUNT_SETTINGS_SECTIONS.map((section) => {
              const active = section.id === activeSection;
              return (
                <Button
                  component={Link}
                  href={section.href}
                  key={section.id}
                  sx={{ alignItems: "flex-start", justifyContent: "flex-start", px: 1.25, py: 1, textAlign: "left" }}
                  variant={active ? "contained" : "text"}
                >
                  <Stack spacing={0.25}>
                    <Typography component="span" sx={{ fontSize: "0.875rem", fontWeight: 800 }}>
                      {section.label}
                    </Typography>
                    <Typography component="span" sx={{ fontSize: "0.75rem", fontWeight: 500, opacity: active ? 0.86 : 0.7 }}>
                      {section.description}
                    </Typography>
                  </Stack>
                </Button>
              );
            })}
          </Stack>
        </DashboardPanel>

        <Stack spacing={2.5} sx={{ minWidth: 0 }}>
          {children}
        </Stack>
      </Box>
    </DashboardPage>
  );
}
