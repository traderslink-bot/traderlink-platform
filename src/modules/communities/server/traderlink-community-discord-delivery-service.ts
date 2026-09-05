import type Database from "better-sqlite3";

import { createCanonicalUtcTimestamp } from "../../platform/server/database/platform-migration-contract";

type DeliveryRow={delivery_id:string;object_type:"alert"|"watchlist"|"coach"|"plan";object_id:string;discord_channel_id:string;community_slug:string;community_name:string};

export class TraderLinkCommunityDiscordDeliveryService {
  constructor(private readonly database:Database.Database,private readonly config:Readonly<{botToken:string;publicOrigin:string}>){ }

  private content(row:DeliveryRow):Readonly<{content:string;allowed_mentions:{parse:readonly string[]}}>{
    if(row.object_type==="alert"){
      const alert=this.database.prepare(`SELECT slug,title,symbol,body FROM traderlink_community_alerts WHERE alert_id=?`).get(row.object_id) as {slug:string;title:string;symbol:string|null;body:string}|undefined;
      if(!alert)throw new Error("Community alert is no longer available.");
      const lead=alert.symbol?`**${alert.symbol} — ${alert.title}**`:`**${alert.title}**`; const url=`${this.config.publicOrigin}/communities/${row.community_slug}/alerts/${alert.slug}`;
      return {content:`${lead}\n${alert.body.slice(0,1500)}\n\nOpen in TraderLink: ${url}`.slice(0,2000),allowed_mentions:{parse:[]}};
    }
    if(row.object_type==="watchlist"){
      const watchlist=this.database.prepare(`SELECT p.handle,w.slug,w.title FROM community_watchlists w JOIN community_profiles p ON p.user_id=w.owner_user_id WHERE w.watchlist_id=?`).get(row.object_id) as {handle:string;slug:string;title:string}|undefined;
      if(!watchlist)throw new Error("Community watchlist is no longer available.");
      const url=`${this.config.publicOrigin}/community/${encodeURIComponent(watchlist.handle)}/watchlists/${encodeURIComponent(watchlist.slug)}`;
      return {content:`**${watchlist.title}**\nShared with ${row.community_name} on TraderLink.\n\nOpen watchlist: ${url}`.slice(0,2000),allowed_mentions:{parse:[]}};
    }
    if(row.object_type==="plan"){
      const plan=this.database.prepare(`SELECT p.name,p.description,p.price_label,c.coach_slug,c.display_name FROM traderlink_community_coaching_plans p JOIN traderlink_community_coach_profiles c ON c.coach_profile_id=p.coach_profile_id WHERE p.plan_id=?`).get(row.object_id) as {name:string;description:string;price_label:string;coach_slug:string;display_name:string}|undefined;
      if(!plan)throw new Error("Community coaching plan is no longer available.");
      const url=`${this.config.publicOrigin}/communities/${row.community_slug}/coaches/${plan.coach_slug}`;
      const price=plan.price_label?`\n${plan.price_label}`:"";
      return {content:`**${plan.name} with ${plan.display_name}**${price}\n${plan.description.slice(0,1400)}\n\nPayment and access are handled by ${row.community_name} in Discord.\nOpen coaching details: ${url}`.slice(0,2000),allowed_mentions:{parse:[]}};
    }
    throw new Error("Unsupported community delivery type.");
  }

  async runAvailable(limit=25):Promise<Readonly<{delivered:number;failed:number}>>{
    const rows=this.database.prepare(`SELECT d.delivery_id,d.object_type,d.object_id,x.discord_channel_id,c.slug community_slug,c.display_name community_name FROM traderlink_community_content_deliveries d JOIN traderlink_community_discord_destinations x ON x.destination_id=d.destination_id JOIN traderlink_communities c ON c.community_id=d.community_id WHERE d.status IN ('pending','failed') AND d.attempt_count<5 AND x.status='active' ORDER BY d.requested_at_utc LIMIT ?`).all(limit) as DeliveryRow[];
    let delivered=0,failed=0;
    for(const row of rows){const started=createCanonicalUtcTimestamp();const claimed=this.database.prepare(`UPDATE traderlink_community_content_deliveries SET status='sending',attempt_count=attempt_count+1,last_error=NULL,updated_at_utc=? WHERE delivery_id=? AND status IN ('pending','failed')`).run(started,row.delivery_id);if(claimed.changes!==1)continue;try{const response=await fetch(`https://discord.com/api/v10/channels/${row.discord_channel_id}/messages`,{method:"POST",headers:{Authorization:`Bot ${this.config.botToken}`,"Content-Type":"application/json"},body:JSON.stringify(this.content(row))});if(!response.ok)throw new Error(`Discord message request failed with ${response.status}.`);const at=createCanonicalUtcTimestamp();this.database.prepare(`UPDATE traderlink_community_content_deliveries SET status='delivered',delivered_at_utc=?,updated_at_utc=? WHERE delivery_id=?`).run(at,at,row.delivery_id);delivered+=1;}catch(error){const at=createCanonicalUtcTimestamp();this.database.prepare(`UPDATE traderlink_community_content_deliveries SET status='failed',last_error=?,updated_at_utc=? WHERE delivery_id=?`).run(error instanceof Error?error.message.slice(0,500):"Discord delivery failed.",at,row.delivery_id);failed+=1;}}
    return Object.freeze({delivered,failed});
  }
}
