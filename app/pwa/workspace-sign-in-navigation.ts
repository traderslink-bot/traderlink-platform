export function isWorkspaceSignInNavigation(url: URL): boolean {
  return url.pathname === "/workspace" && url.searchParams.get("auth") === "connected";
}
