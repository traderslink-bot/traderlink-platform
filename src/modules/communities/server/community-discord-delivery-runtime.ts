import "server-only";
import { resolvePlatformBackgroundWorkerMode } from "@/src/modules/platform/server/runtime/platform-background-worker-mode";
import { nonOverlappingCoachingMaintenance } from "./coaching-maintenance-service";

// Explicit release switch; private acceptance stays worker-free.
function deliveryEnabled():boolean {
  return process.env.NODE_ENV==="production"
    &&process.env.TRADERLINK_COMMUNITY_DISCORD_DELIVERY_ENABLED==="true"
    &&resolvePlatformBackgroundWorkerMode()==="enabled";
}

// Cron and the hosted timer share a guard; the persistent row claim protects
// individual messages too. Existing historical rows can be held by a cutoff.
export const runHostedCommunityDiscordDelivery = nonOverlappingCoachingMaintenance(async () => {
  if(!deliveryEnabled())return null;
  const botToken=process.env.TRADERLINK_DISCORD_BOT_TOKEN?.trim();
  const publicOrigin=process.env.TRADERLINK_PLATFORM_PUBLIC_ORIGIN?.trim();
  if(!botToken||!publicOrigin)return null;
  const origin=new URL(publicOrigin).origin;
  const {openPlatformDatabase}=await import("../../platform/server/database/open-platform-database");
  const {runCommunityDiscordDeliveryPass}=await import("./community-discord-delivery-pass");
  const database=openPlatformDatabase({mode:"runtime"});
  try {
    return await runCommunityDiscordDeliveryPass(database,{
      botToken,publicOrigin:origin,
      notBeforeUtc:process.env.TRADERLINK_COMMUNITY_DELIVERY_NOT_BEFORE_UTC?.trim()||undefined,
      limit:5,
    });
  } finally {database.close();}
});

let started=false;
export function startHostedCommunityDiscordDelivery():void {
  if(!deliveryEnabled()||started)return;
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
