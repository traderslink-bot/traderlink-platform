/** Only public-facing community content belongs in the server's page-view analytics. */
export function isCommunityContentActivityPath(slug: string, path: string): boolean {
  if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/u.test(slug)) return false;
  const prefix = `/communities/${slug}`;
  if (path === prefix) return true;
  if (!path.startsWith(`${prefix}/`)) return false;
  const relative = path.slice(prefix.length);
  return /^\/(?:alerts|watchlists|server-watchlists|coaches)(?:\/[a-zA-Z0-9_-]+)?$/u.test(relative);
}
