export {
  hasPlatformDiscordPremiumAccess,
  isPremiumWatchlistRoleConfigured,
} from "@/src/modules/watchlist/server/access/platform-discord-watchlist-entitlement";
export {
  authorizeWatchlistRequest as authorizePremiumWatchlistRequest,
} from "@/src/modules/watchlist/server/access/watchlist-access-service";
export type {
  WatchlistAccessResult as PremiumWatchlistAuthResult,
} from "@/src/modules/watchlist/server/access/watchlist-access-service";
