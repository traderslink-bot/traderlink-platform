/** Proxy-owned navigation mode. This never authorizes a mutation or Journal read. */
export const COMMUNITY_HISTORY_HEADER = "x-traderlink-community-history";
export type CommunityHistoryEntry = Readonly<{
  path: string;
  slug: string;
  role: "coach" | "student";
  relationshipId: string | null;
  reviewId: string | null;
}>;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;
const slugPattern = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/u;
export function classifyCommunityHistoryEntry(
  path: string, query: URLSearchParams, method: string,
): CommunityHistoryEntry | "invalid" | null {
  if (!["GET", "HEAD"].includes(method)) return null;
  const parts = path.match(/^\/communities\/([^/]+)\/(coaching|workspace\/students(?:\/([^/]+)(?:\/reviews\/([^/]+)(?:\/final)?)?)?)\/?$/u);
  if (!parts || !query.has("view")) return null;
  if (query.getAll("view").length !== 1) return "invalid";
  // Preserve the existing coach directory live-view selector and its normal guard.
  if (parts[2] === "workspace/students" && query.get("view") === "active") return null;
  if (query.get("view") !== "history") return "invalid";
  const slug = parts[1];
  if (!slug || !slugPattern.test(slug) || slug.length < 3 || slug.length > 80) return "invalid";
  const role = parts[2] === "coaching" ? "student" : "coach";
  const selections = query.getAll("student");
  if (selections.length > 1 || (selections.length === 1 && !uuid.test(selections[0]!))) return "invalid";
  const relationshipId = parts[3] ?? selections[0] ?? null;
  const reviewId = parts[4] ?? null;
  if ((relationshipId && !uuid.test(relationshipId)) || (reviewId && !uuid.test(reviewId))) return "invalid";
  if (parts[3] && selections.length && parts[3] !== selections[0]) return "invalid";
  return { path, slug, role, relationshipId, reviewId };
}
/** The proxy overwrites this header on every request; check it against its path too. */
export function readCommunityHistoryEntry(headers: Pick<Headers, "get">): CommunityHistoryEntry | "invalid" | null {
  const encoded = headers.get(COMMUNITY_HISTORY_HEADER);
  if (!encoded) return null;
  if (encoded === "invalid") return "invalid";
  try {
    const value = JSON.parse(encoded) as CommunityHistoryEntry;
    if (value.path !== headers.get("x-traderlink-page-path")) return "invalid";
    const query = new URLSearchParams({ view: "history" });
    if (value.relationshipId) query.set("student", value.relationshipId);
    const parsed = classifyCommunityHistoryEntry(value.path, query, "GET");
    return parsed && parsed !== "invalid" && JSON.stringify(parsed) === JSON.stringify(value) ? parsed : "invalid";
  } catch { return "invalid"; }
}
