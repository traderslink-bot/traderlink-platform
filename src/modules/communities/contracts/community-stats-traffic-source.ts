/** Only bounded hostnames and campaign slugs cross this boundary. Never retain URLs, queries or click IDs. */
export type StatsTrafficInput={referrerHost?:unknown;campaignSource?:unknown;campaignMedium?:unknown;campaignName?:unknown};
export type StatsTrafficSource={category:string;source:string;referrerHost:string|null;campaignSource:string|null;campaignMedium:string|null;campaignName:string|null};
const campaign=(value:unknown)=>typeof value==='string'&&/^[a-z0-9][a-z0-9._-]{0,79}$/iu.test(value)?value:null;
export function normalizeStatsTrafficSource(input:StatsTrafficInput,ownHost:string):StatsTrafficSource{
  let host=typeof input.referrerHost==='string'?input.referrerHost.toLowerCase().replace(/\.$/u,''):'';
  if(host.length>253||!host.includes('.')||!host.split('.').every(part=>/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/u.test(part))||/^\d+(?:\.\d+){3}$/u.test(host))host='';
  const source=campaign(input.campaignSource),medium=campaign(input.campaignMedium),name=campaign(input.campaignName);
  const internal=!!host&&host===ownHost.toLowerCase();
  const matches=(domains:string[])=>domains.some(domain=>host===domain||host.endsWith('.'+domain));
  const category=source||medium||name?'Campaign':internal?'Internal':!host?'Direct or unknown':matches(['google.com','google.ca','google.co.uk','google.com.au','google.de','google.fr','bing.com','duckduckgo.com','search.yahoo.com','baidu.com','yandex.com'])?'Search':matches(['discord.com','discord.gg','facebook.com','instagram.com','t.co','x.com','twitter.com','reddit.com','linkedin.com','youtube.com','t.me','telegram.org','threads.net','bsky.app','pinterest.com','whatsapp.com'])?'Social':'Referral';
  return {category,source:source??(internal?'Internal':host||'Direct or unknown'),referrerHost:host||null,campaignSource:source,campaignMedium:medium,campaignName:name};
}
