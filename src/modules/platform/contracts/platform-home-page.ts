export const PLATFORM_ENTRY_PATH = "/dashboard-entry";
export const PLATFORM_PWA_START_PATH = `${PLATFORM_ENTRY_PATH}?launch=pwa`;

export const PLATFORM_HOME_PAGES = {
  welcome: { label: "Welcome", href: "/welcome" },
  "trading-workspace": { label: "Trading Workspace", href: "/trading-workspace" },
  scanners: { label: "Scanners", href: "/scanners" },
  screeners: { label: "Screeners", href: "/screeners" },
  "journal-workspace": { label: "Journal Workspace", href: "/workspace" },
} as const;

export type PlatformHomePage = keyof typeof PLATFORM_HOME_PAGES;
export const PLATFORM_DEFAULT_HOME_PAGE: PlatformHomePage = "welcome";

export function isPlatformHomePage(value: unknown): value is PlatformHomePage {
  return typeof value === "string" && Object.hasOwn(PLATFORM_HOME_PAGES, value);
}

// These landing pages perform their own signed-in check. Product routes
// still require the dashboard admission policy and their individual checks.
export function isPlatformSignedInLandingPath(path: string | null): boolean {
  const welcome = PLATFORM_HOME_PAGES.welcome.href;
  const journal = PLATFORM_HOME_PAGES["journal-workspace"].href;
  return path === welcome || path === `${welcome}/` || path === journal || path === `${journal}/`;
}
