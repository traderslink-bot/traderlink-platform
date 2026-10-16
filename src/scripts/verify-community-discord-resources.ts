import { strict as assert } from "node:assert";
import { canBotPublish, readCommunityDiscordResources } from "../modules/communities/server/community-discord-resources";

async function main() {
  const roles = [{id:"100",name:"@everyone",permissions:"3072"},{id:"101",name:"Bot",permissions:"0"}];
  assert.equal(canBotPublish("100","300",["101"],roles,[]),true);
  const denyEveryone={id:"100",type:0,allow:"0",deny:"1024"};
  assert.equal(canBotPublish("100","300",["101"],roles,[denyEveryone]),false);
  const allowBotRole={id:"101",type:0,allow:"1024",deny:"0"};
  assert.equal(canBotPublish("100","300",["101"],roles,[denyEveryone,allowBotRole]),true);
  assert.equal(canBotPublish("100","300",["101"],roles,[denyEveryone,allowBotRole,{id:"300",type:1,allow:"0",deny:"2048"}]),false);
  assert.equal(canBotPublish("100","300",[],roles,[{id:"101",type:0,allow:"0",deny:"2048"}]),true,"Unassigned role overwrite must not affect the bot");
  assert.equal(canBotPublish("100","300",["101"],[roles[0],{...roles[1],permissions:"8"}],[denyEveryone]),true);
  assert.equal(canBotPublish("999","300",[],roles,[]),false);

  const request=(async(url:string|URL|Request,options?:RequestInit)=>{
    assert.equal(options?.cache,"no-store");
    const path=String(url).replace("https://discord.com/api/v10/","");
    const data=path==="users/@me"?{id:"300",bot:true}
      :path==="guilds/100/roles"?roles
      :path==="guilds/100/members/300"?{user:{id:"300"},roles:["101"]}
      :path==="guilds/100/channels"?[
        {id:"400",guild_id:"100",name:"private",type:0,permission_overwrites:[denyEveryone,allowBotRole]},
        {id:"401",guild_id:"100",name:"blocked",type:0,permission_overwrites:[denyEveryone]},
        {id:"402",guild_id:"100",name:"forum",type:15,permission_overwrites:[]},
      ]:null;
    return new Response(JSON.stringify(data),{status:data?200:403});
  }) as typeof fetch;
  const result=await readCommunityDiscordResources("100","fixture-only",request);
  assert.equal(result.roles[0].name,"@everyone");
  assert.deepEqual(result.channels,[{id:"400",name:"private",canPublish:true},{id:"401",name:"blocked",canPublish:false}]);
  await assert.rejects(readCommunityDiscordResources("200","fixture-only",request),/unavailable/);
  await assert.rejects(readCommunityDiscordResources("100","",request),/unavailable/);
  for(const status of [403,404,429,500])await assert.rejects(readCommunityDiscordResources("100","fixture-only",(async()=>new Response("{}",{status})) as typeof fetch),/unavailable/);
  const spoofed=(async(url:string|URL|Request,options?:RequestInit)=>String(url).endsWith("/channels")?new Response(JSON.stringify([{id:"400",guild_id:"200",name:"foreign",type:0,permission_overwrites:[]}])):request(url,options)) as typeof fetch;
  await assert.rejects(readCommunityDiscordResources("100","fixture-only",spoofed),/channels unavailable/);
  const malformed=(async(url:string|URL|Request,options?:RequestInit)=>String(url).endsWith("/roles")?new Response(JSON.stringify([{id:"100",name:"@everyone",permissions:"bad"}])):request(url,options)) as typeof fetch;
  await assert.rejects(readCommunityDiscordResources("100","fixture-only",malformed),/roles unavailable/);
  console.log("PASS: Discord resources, guild isolation, private channel permissions, overrides, unsupported channel types and provider failures. HTTP responses are fixture data, not live Discord proof.");
}
main().catch(error=>{console.error(error);process.exitCode=1;});
