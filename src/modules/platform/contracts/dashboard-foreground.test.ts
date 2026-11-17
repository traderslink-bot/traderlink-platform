// @vitest-environment node

import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { createTraderMaterialTheme } from "@/app/mui-theme";
import type { PlatformAppearance } from "./platform-appearance";

function renderBaseline(appearance: PlatformAppearance) {
  const theme = createTraderMaterialTheme(appearance);
  const markup = renderToStaticMarkup(createElement(
    ThemeProvider,
    { theme },
    createElement(CssBaseline),
  ));
  return { markup, theme };
}

describe("dashboard foreground", () => {
  it("sets the body foreground token to the Navy Dark text color", () => {
    const { markup, theme } = renderBaseline("dark");
    expect(markup).toContain(`body{--foreground:${theme.palette.text.primary};}`);
    expect(theme.palette.text.primary).toBe("#ffffff");
  });

  it("keeps the global stylesheet's foreground in Light mode", () => {
    const { markup } = renderBaseline("light");
    expect(markup).toContain("body{");
    expect(markup).not.toContain("--foreground:");
  });
});
