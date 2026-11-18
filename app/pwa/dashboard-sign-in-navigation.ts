import { PLATFORM_ENTRY_PATH, PLATFORM_HOME_PAGES } from "@/src/modules/platform/contracts/platform-home-page";

export function isDashboardSignInNavigation(url: URL): boolean {
  return (url.pathname === PLATFORM_ENTRY_PATH || url.pathname === PLATFORM_HOME_PAGES["journal-workspace"].href)
    && url.searchParams.get("auth") === "connected";
}
