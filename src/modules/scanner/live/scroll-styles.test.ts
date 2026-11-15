import { createTraderMaterialTheme } from "@/app/mui-theme";
import { describe, expect, it } from "vitest";
import { scannerScrollStyles } from "./scroll-styles";

describe("scanner-only overflow styling", () => {
  it("scrolls only on overflow with slim, theme-aware thumbs", () => {
    const light = scannerScrollStyles(createTraderMaterialTheme("light"));
    const dark = scannerScrollStyles(createTraderMaterialTheme("dark"));
    for (const style of [light,dark]) {
      expect(style.overflowY).toBe("auto");
      expect(style.scrollbarWidth).toBe("thin");
      expect(style['&::-webkit-scrollbar']).toEqual({width:5,height:5});
      expect(style['&::-webkit-scrollbar-track'].backgroundColor).toBe("transparent");
    }
    expect(light.scrollbarColor).not.toBe(dark.scrollbarColor);
  });
});
