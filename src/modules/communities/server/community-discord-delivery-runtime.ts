import "server-only";
import { openPlatformDatabase } from "../../platform/server/database/open-platform-database";
import { nonOverlappingCoachingMaintenance } from "./coaching-maintenance-service";
import { TraderLinkCommunityDiscordDeliveryService } from "./traderlink-community-discord-delivery-service";

// Cron and the hosted timer share a guard; the persistent row claim protects
// individual messages too. Existing historical rows can be held by a cutoff.
export const runHostedCommunityDiscordDelivery = nonOverlappingCoachingMaintenance(async () => {
  const botToken=process.env.TRADERLINK_DISCORD_BOT_TOKEN?.trim();
  const publicOrigin=process.env.TRADERLINK_PLATFORM_PUBLIC_ORIGIN?.trim();
  if(!botToken||!publicOrigin)return null;
  const origin=new URL(publicOrigin).origin;
  const database=openPlatformDatabase({mode:"runtime"});
  try {
    return await new TraderLinkCommunityDiscordDeliveryService(database,{
      botToken,publicOrigin:origin,
      notBeforeUtc:process.env.TRADERLINK_COMMUNITY_DELIVERY_NOT_BEFORE_UTC?.trim()||undefined,
    }).runAvailable(5);
  } finally {database.close();}
});

let started=false;
export function startHostedCommunityDiscordDelivery():void {
  if(started)return;
  started=true;
  const tick=async()=>{
    try {
      const result=await runHostedCommunityDiscordDelivery();
      if(result&&(result.delivered||result.failed))console.info("TraderLink community delivery pass.",result);
    } catch(error) {
      console.error("TraderLink community delivery failed.",{errorName:error instanceof Error?error.name:"UnknownError"});
    }
  };
  setInterval(()=>void tick(),15_000).unref();
}
