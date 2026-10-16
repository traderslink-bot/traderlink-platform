"use client";
import Link from "next/link";
import {usePathname} from "next/navigation";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import {DashboardPanel} from "@/app/dashboard-ui";
import type {TraderLinkCommunityDashboardSnapshot} from "@/src/modules/communities/contracts/traderlink-community-platform-contracts";

type Item={label:string;href:string};
export function CommunityNavigation({snapshot,baseOverride}:{snapshot:TraderLinkCommunityDashboardSnapshot;baseOverride?:string}){
 const base=baseOverride??`/communities/${snapshot.community.slug}`;
 const path=usePathname();
 const has=(key:string)=>snapshot.viewer.capabilities.some(capability=>capability===key);
 const coach=has("community.coaching.offer")||has("community.coaching.students");
 const student=snapshot.relationships.some(item=>item.studentUserId===snapshot.viewer.userId);
 const market:Item[]=[];
 if(has("community.alerts.view")||has("community.alerts.create"))market.push({label:"Alerts",href:`${base}/alerts`});
 if(has("community.watchlists.view")||has("community.watchlists.publish_staff"))market.push({label:"Watchlists",href:`${base}/watchlists`});
 const coaching:Item[]=[];
 if(has("community.coaching.view")||has("community.coaching.offer")||has("community.coaching.manage_all"))coaching.push({label:"Coaches",href:`${base}/coaches`});
 if(student)coaching.push({label:"My coaching",href:`${base}/coaching`});
 if(coach)coaching.push({label:"Coaching work",href:`${base}/workspace`},{label:"Students",href:`${base}/workspace/students`},{label:"Coach setup",href:`${base}/workspace/setup`});
 const manage=[{label:"Team",key:"team",permission:"community.team.manage"},{label:"Discord role access",key:"roles",permission:"community.roles.manage"},{label:"Members",key:"members",permission:"community.members.view"},{label:"Activity",key:"activity",permission:"community.analytics.view"},{label:"Discord channels",key:"channels",permission:"community.discord.manage"},{label:"Settings",key:"settings",permission:"community.manage"}].filter(item=>snapshot.community.isOwner||has(item.permission)).map(item=>({label:item.label,href:`${base}/manage/${item.key}`}));
 const canManage=snapshot.community.isOwner||has("community.manage");
 const group=path.includes(`${base}/manage`)?"Manage":path.includes(`${base}/alerts`)||path.includes(`${base}/watchlists`)||path.includes(`${base}/server-watchlists`)?"Trading desk":path.includes(`${base}/coach`)||path.includes(`${base}/workspace`)?"Coaching":"Overview";
 const top:Item[]=[{label:"Overview",href:base},...(market.length?[{label:"Trading desk",href:market[0].href}]:[]),...(coaching.length?[{label:"Coaching",href:coach?`${base}/workspace`:student?`${base}/coaching`:coaching[0].href}]:[]),...(canManage||manage.length?[{label:"Manage",href:canManage?`${base}/manage`:manage[0].href}]:[])];
 const children=group==="Trading desk"?market:group==="Coaching"?coaching:group==="Manage"?manage:[];
 const setup=coach&&(path.includes(`${base}/workspace/setup`)||path.includes(`${base}/workspace/teaching`));
 const links=(items:Item[],primary=false)=>items.map(item=>{const active=primary?item.label===group:path===item.href||(item.label==="Coach setup"&&path.includes(`${base}/workspace/teaching`));return <Button component={Link} key={item.href} href={item.href} aria-current={active?"page":undefined} variant={active?"contained":"text"}>{item.label}</Button>});
 return <DashboardPanel hideHeader><Stack component="nav" aria-label="Community" direction="row" sx={{flexWrap:"wrap",gap:1}}>{links(top,true)}</Stack>{children.length?<Stack component="nav" aria-label={`${group} pages`} direction="row" sx={{flexWrap:"wrap",gap:1,mt:1}}>{links(children)}</Stack>:null}{setup?<Stack component="nav" aria-label="Coach setup pages" direction="row" sx={{flexWrap:"wrap",gap:1,mt:1}}>{links([{label:"Profile and plans",href:`${base}/workspace/setup`},{label:"Lessons",href:`${base}/workspace/teaching`}])}</Stack>:null}</DashboardPanel>;
}
