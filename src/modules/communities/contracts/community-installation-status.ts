export type CommunityInstallationState = "not_installed" | "ready" | "owner_required" | "unavailable" | "connected";
export type CommunityInstallationStatus = Readonly<{
  state: CommunityInstallationState;
  message: string;
  href?: string;
}>;

export const COMMUNITY_INSTALLATION_MESSAGES = {
  not_installed: "The TraderLink Discord app is not installed in this server. Install it as the server owner, then return here and choose Recheck installation.",
  ready: "Discord app installed and ready to connect. Channel publishing access is checked separately in community settings.",
  owner_required: "We couldn't verify that you own this server. Refresh Discord servers with the server owner's account, or contact the server owner.",
  unavailable: "We couldn't verify the Discord app installation. Choose Recheck installation to try again. If this continues, ask the server owner to check the app's access in Discord, or contact TraderLink support.",
  connected: "Server connected",
} as const;
