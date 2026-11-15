import type { Definition } from "./contracts";

export const SHARED_SCREEN_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
export const COMMUNITY_PAGE_SIZE = 12;

export type SharedScreen = {
  id: string;
  name: string;
  author: string;
  definition: Definition;
  listed: boolean;
};

export type CommunityPage = { screens: SharedScreen[]; next: string | null };

export type ShareCommand = { screenId: string; expectedId: string | null } & (
  | { operation: "publish"; revision: number; listed: boolean }
  | { operation: "visibility"; listed: boolean }
  | { operation: "revoke" }
);

export const sharedScreenPath = (id: string) => "/screeners?shared=" + encodeURIComponent(id);
export const sharedScreenLinkPath = (id: string) => "/api/stock-screeners?open=" + encodeURIComponent(id);
