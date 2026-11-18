import "server-only";
import {createHash} from "node:crypto";
import {assertSharedFixtureContext,withSharedFixtureActorOperation,type SharedFixtureContext,type FixtureKey} from "./shared-alerts-staging-fixture-authority";
import {claimFixtureDelivery} from "./shared-alerts-staging-fixture-model";
import {SharedAlertsDiscord} from "./shared-alerts-discord";
import {COMMUNITY_REVIEW_DISCORD_GUILD_ID as GUILD} from "./community-review-discord-guild";
/** Real Tests-only provider facts are never substituted for synthetic agreement ownership. */
export async function deliverSharedFixtureAlert(context:SharedFixtureContext,request:Request,key:FixtureKey,deliveryId:string){
 let authority!:ReturnType<typeof assertSharedFixtureContext>,ticket!:ReturnType<typeof claimFixtureDelivery>;
 withSharedFixtureActorOperation(context,request,key,()=>{authority=assertSharedFixtureContext(context);ticket=claimFixtureDelivery(context,request,key,deliveryId);});
 let started=false,settled=false;
 try{
  const botToken=process.env.TRADERLINK_DISCORD_BOT_TOKEN?.trim();if(!botToken)throw new Error("Test bot unavailable.");
  const transport:typeof fetch=(resource,options)=>{
   const url=new URL(typeof resource==="string"?resource:resource instanceof URL?resource.href:resource.url);
   const method=(options?.method??"GET").toUpperCase();
   const validateTarget=()=>{
   // This additional guard is deliberately narrower than the parent capability.
   if(url.origin!=="https://discord.com"||url.username||url.password||url.hash||url.search||method!=="GET"&&method!=="POST")throw new Error("Test transport target refused.");
   const allowed=method==="GET"&&(url.pathname==="/api/v10/users/@me"||url.pathname===`/api/v10/guilds/${GUILD}/channels`||url.pathname===`/api/v10/guilds/${GUILD}/roles`||new RegExp(`^/api/v10/guilds/${GUILD}/members/\\d{1,32}$`).test(url.pathname))||method==="POST"&&url.pathname===`/api/v10/channels/${ticket.channelId}/messages`;
   if(!allowed)throw new Error("Test transport target refused.");
   };
   return authority.parent.requestWithFixtureOperation(resource,{...options,redirect:"error",signal:AbortSignal.any([request.signal,authority.parent.signal,...(options?.signal?[options.signal]:[])])},operation=>withSharedFixtureActorOperation(context,request,key,()=>{ticket.check();validateTarget();operation();if(method==="GET")ticket.check();}));
  };
  const discord=new SharedAlertsDiscord(botToken,transport),channel=await discord.verifyChannel(GUILD,ticket.channelId);
  ticket.check();
  if(channel.guildId!==GUILD||channel.channelId!==ticket.channelId||!authority.manifest.principals.find(p=>p.key===ticket.receiver)?.channelIds.includes(channel.channelId))throw new Error("Test channel mapping changed.");
  for(const principal of authority.manifest.principals){
   const response=await transport(`https://discord.com/api/v10/guilds/${GUILD}/members/${principal.subject}`,{headers:{Authorization:`Bot ${botToken}`}});
   if(!response.ok)throw new Error("Actual Tests membership unavailable.");
   const member=await response.json() as {user?:{id?:string;bot?:boolean};guild_id?:string};ticket.check();
   if(member.user?.id!==principal.subject||member.user.bot||member.guild_id!==undefined&&member.guild_id!==GUILD)throw new Error("Actual Tests membership unavailable.");
  }
  ticket.check();ticket.startWrite();started=true;
  const response=await transport(`https://discord.com/api/v10/channels/${channel.channelId}/messages`,{method:"POST",headers:{Authorization:`Bot ${botToken}`,"Content-Type":"application/json"},body:JSON.stringify({content:ticket.content,nonce:createHash("sha256").update(`${context.fixtureId}:${deliveryId}`).digest("hex").slice(0,24),enforce_nonce:true,allowed_mentions:{parse:[],replied_user:false}})});
  if(!response.ok){ticket.settle(response.status>=500?"uncertain":"rejected",null);settled=true;throw new Error("Tests Discord write not confirmed.");}
  const receipt=await response.json() as {id?:string;channel_id?:string};
  if(!receipt.id||!/^\d{1,32}$/.test(receipt.id)||receipt.channel_id!==channel.channelId)throw new Error("Tests Discord receipt unavailable.");
  // A completed provider receipt remains model evidence even if the permit expired in flight.
  ticket.settle("delivered",receipt.id);settled=true;
  return Object.freeze({label:"ActualDiscordIO" as const,guildId:GUILD,channelId:channel.channelId,messageId:receipt.id});
 }catch(error){if(!settled)ticket.settle(started?"uncertain":"cancelled",null);throw error;}
}
