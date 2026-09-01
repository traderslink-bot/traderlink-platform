"use client";

import { alpha, createTheme } from "@mui/material/styles";

import type { PlatformAppearance } from "@/src/modules/platform/contracts/platform-appearance";

export const traderIntelligencePrimaryAction = "#011E56";

export type TraderLinkChartPalette = Readonly<{
  actionHover: string;
  background: string;
  candleLoss: string;
  candleWin: string;
  controlBorder: string;
  controlText: string;
  grid: string;
  loss: string;
  text: string;
  win: string;
}>;

export type TraderLinkPalette = Readonly<{
  appBar: string;
  chart: TraderLinkChartPalette;
  navigation: string;
  navigationSelected: string;
  navigationSelectedText: string;
}>;

declare module "@mui/material/styles" {
  interface Palette {
    traderLink: TraderLinkPalette;
  }

  interface PaletteOptions {
    traderLink: TraderLinkPalette;
  }
}

const lightPalette = Object.freeze({
  appBar: "#ffffff",
  chart: Object.freeze({
    actionHover: "#0b3475",
    background: "#f8fbff",
    candleLoss: "#d14343",
    candleWin: "#1b8a5a",
    controlBorder: "#b8c6d9",
    controlText: "#41516a",
    grid: "#dce5f0",
    loss: "#c62828",
    text: "#172033",
    win: "#00796b",
  }),
  navigation: "#ffffff",
  navigationSelected: traderIntelligencePrimaryAction,
  navigationSelectedText: "#ffffff",
});

const darkPalette = Object.freeze({
  appBar: "#121d2b",
  chart: Object.freeze({
    actionHover: "#285a9f",
    background: "#151f2d",
    candleLoss: "#ff7373",
    candleWin: "#56d487",
    controlBorder: "#52647d",
    controlText: "#aeb9c9",
    grid: "#314158",
    loss: "#ff7373",
    text: "#e8edf7",
    win: "#56d487",
  }),
  navigation: "#121a26",
  navigationSelected: "#24344a",
  navigationSelectedText: "#f7f9fc",
});

export function createTraderMaterialTheme(appearance: PlatformAppearance) {
  const dark = appearance === "dark";
  const palette = dark
    ? {
      action: {
        active: "#c9d3e2",
        disabled: "#707d90",
        disabledBackground: "#232d3b",
        hover: "#24344a",
        selected: "#24344a",
      },
      background: { default: "#0e1520", paper: "#151f2d" },
      divider: "#314158",
      error: { contrastText: "#0e1520", main: "#ff7373" },
      info: { contrastText: "#0e1520", main: "#79aaf1" },
      mode: "dark" as const,
      primary: { contrastText: "#ffffff", dark: "#285a9f", light: "#79aaf1", main: "#285a9f" },
      secondary: { contrastText: "#e8edf7", main: "#52647d" },
      success: { contrastText: "#071d11", main: "#56d487" },
      text: { disabled: "#707d90", primary: "#ffffff", secondary: "#ffffff" },
      traderLink: darkPalette,
      warning: { contrastText: "#201400", main: "#ffc76b" },
    }
    : {
      background: { default: "#f5f7fb", paper: "#ffffff" },
      divider: alpha(traderIntelligencePrimaryAction, 0.12),
      error: { main: "#b3261e" },
      info: { main: "#00639b" },
      mode: "light" as const,
      primary: {
        contrastText: "#ffffff",
        dark: traderIntelligencePrimaryAction,
        light: "#4f83e3",
        main: traderIntelligencePrimaryAction,
      },
      secondary: { contrastText: "#ffffff", main: traderIntelligencePrimaryAction },
      success: { main: "#137333" },
      text: { disabled: "#8a94a6", primary: "#172033", secondary: "#5f6b7d" },
      traderLink: lightPalette,
      warning: { main: "#8a4f00" },
    };

  return createTheme({
    palette,
    shape: { borderRadius: 12 },
    typography: {
      fontFamily: "var(--font-geist-sans), Arial, Helvetica, sans-serif",
      h1: { fontSize: "1.75rem", fontWeight: 720, letterSpacing: "-0.025em" },
      h2: { fontSize: "1.25rem", fontWeight: 700, letterSpacing: "-0.015em" },
      h3: { fontSize: "1rem", fontWeight: 700 },
      subtitle1: { fontWeight: 650 },
      button: { fontWeight: 650, letterSpacing: 0, textTransform: "none" },
    },
    components: {
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: {
            borderRadius: 8,
            minHeight: 40,
            boxShadow: "none",
            fontWeight: 700,
            textTransform: "none",
            "&:hover": { boxShadow: "none" },
            "&:active": { boxShadow: "none" },
            "&.Mui-focusVisible": dark ? { outline: "2px solid #79aaf1", outlineOffset: 2 } : undefined,
          },
        },
        variants: [
          {
            props: { color: "primary", variant: "contained" },
            style: {
              backgroundColor: dark ? "#285a9f" : traderIntelligencePrimaryAction,
              color: "#ffffff",
              "&:hover": { backgroundColor: dark ? "#285a9f" : "#001744" },
            },
          },
          {
            props: { color: "primary", variant: "outlined" },
            style: {
              borderColor: dark ? "#52647d" : traderIntelligencePrimaryAction,
              color: dark ? "#e8edf7" : traderIntelligencePrimaryAction,
              "&:hover": {
                backgroundColor: dark ? "#24344a" : alpha(traderIntelligencePrimaryAction, 0.05),
                borderColor: dark ? "#52647d" : traderIntelligencePrimaryAction,
              },
            },
          },
          {
            props: { color: "primary", variant: "text" },
            style: {
              color: dark ? "#79aaf1" : traderIntelligencePrimaryAction,
              "&:hover": { backgroundColor: dark ? "#24344a" : alpha(traderIntelligencePrimaryAction, 0.05) },
            },
          },
        ],
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
            border: dark ? "1px solid #314158" : `1px solid ${alpha(traderIntelligencePrimaryAction, 0.1)}`,
            boxShadow: dark ? "none" : "0 1px 2px rgba(20, 38, 68, 0.04)",
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            ...(dark ? {
              backgroundColor: "#24344a",
              color: "#e8edf7",
              "&.MuiChip-colorError": { backgroundColor: "#ff7373", color: "#0e1520" },
              "&.MuiChip-colorSuccess": { backgroundColor: "#56d487", color: "#0e1520" },
              "&.MuiChip-colorWarning": { backgroundColor: "#ffc76b", color: "#0e1520" },
            } : {}),
            borderRadius: 8,
            fontWeight: 650,
          },
        },
      },
      MuiCssBaseline: {
        styleOverrides: dark ? {
          "*:focus-visible": { outline: "2px solid #79aaf1", outlineOffset: 2 },
        } : undefined,
      },
      MuiDrawer: { styleOverrides: { paper: { backgroundImage: "none" } } },
      MuiLink: {
        styleOverrides: {
          root: dark ? { color: "#79aaf1", textUnderlineOffset: 3 } : undefined,
        },
      },
      MuiOutlinedInput: { styleOverrides: { root: dark ? { backgroundColor: "#0e1520" } : undefined } },
      MuiPaper: { styleOverrides: { root: { backgroundImage: "none" } } },
      MuiTableCell: {
        styleOverrides: {
          head: {
            backgroundColor: dark ? "#151f2d" : "#f7f9fc",
            color: dark ? "#ffffff" : "#4f5d73",
            fontSize: "0.75rem",
            fontWeight: 700,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          },
        },
      },
      MuiTooltip: { styleOverrides: { tooltip: { borderRadius: 8, fontSize: "0.75rem" } } },
    },
  });
}

export const traderMaterialTheme = createTraderMaterialTheme("light");
