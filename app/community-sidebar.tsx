"use client";
import {useState,useSyncExternalStore} from "react";
import Link from "next/link";
import {Box,Breadcrumbs,Button,Collapse,List,ListItemButton,ListItemIcon,ListItemText,Typography} from "@mui/material";
import ChevronRightRounded from "@mui/icons-material/ChevronRightRounded";
import ExpandMoreRounded from "@mui/icons-material/ExpandMoreRounded";
import ArrowBackRounded from "@mui/icons-material/ArrowBackRounded";
import DashboardRounded from "@mui/icons-material/DashboardRounded";
import PeopleOutlineRounded from "@mui/icons-material/PeopleOutlineRounded";
import SettingsOutlined from "@mui/icons-material/SettingsOutlined";
import SchoolOutlined from "@mui/icons-material/SchoolOutlined";
import WorkOutlineRounded from "@mui/icons-material/WorkOutlineRounded";
import CalendarMonthRounded from "@mui/icons-material/CalendarMonthRounded";
import DescriptionOutlined from "@mui/icons-material/DescriptionOutlined";
import MoveToInboxOutlined from "@mui/icons-material/MoveToInboxOutlined";
import PersonOutlineRounded from "@mui/icons-material/PersonOutlineRounded";
import type {CommunityMenu,CommunityMenuItem} from "./community-navigation-context";
function contains(item:CommunityMenuItem,path:string,base:string):boolean{return Boolean(item.href&&(path===item.href||(item.href!==base&&path.startsWith(item.href+"/"))))||Boolean(item.children?.some(child=>contains(child,path,base)));}
function MenuRow({item,path,base,onNavigate,selectedHref,depth=0}:{item:CommunityMenuItem;path:string;base:string;onNavigate:()=>void;selectedHref?:string;depth?:number}){
 const active=item.children?contains(item,path,base):item.href===selectedHref;
 const [expanded,setExpanded]=useState<boolean|null>(null);
 const open=expanded??active;
 const Icon=({Overview:DashboardRounded,Coaching:SchoolOutlined,Manage:SettingsOutlined,"Coaching work":WorkOutlineRounded,Calendar:CalendarMonthRounded,Students:PeopleOutlineRounded,"Coaching plans":DescriptionOutlined,"Enrollment requests":MoveToInboxOutlined,"Coach setup":SettingsOutlined,Profile:PersonOutlineRounded} as Record<string,typeof DashboardRounded>)[item.label]??PeopleOutlineRounded;
 if(item.children)return <Box><ListItemButton aria-expanded={open} onClick={()=>setExpanded(!open)} sx={{mx:1,borderRadius:1,pl:2+depth*2,minHeight:44}}><ListItemIcon sx={{minWidth:32}}><Icon fontSize="small"/></ListItemIcon><ListItemText primary={item.label} slotProps={{primary:{sx:{fontWeight:600,fontSize:14}}}}/>{open?<ExpandMoreRounded fontSize="small"/>:<ChevronRightRounded fontSize="small"/>}</ListItemButton><Collapse in={open} unmountOnExit><List disablePadding>{item.children.map(child=><MenuRow key={child.label} item={child} path={path} base={base} onNavigate={onNavigate} selectedHref={selectedHref} depth={depth+1}/>)}</List></Collapse></Box>;
 return <ListItemButton component={Link} href={item.href!} prefetch={false} onClick={onNavigate} selected={active} aria-current={active?"page":undefined} sx={{mx:1,borderRadius:1,pl:2+depth*2,minHeight:44,"&.Mui-selected":{color:(theme)=>theme.palette.mode==="dark"?theme.palette.traderLink.navigationSelectedText:theme.palette.primary.main,bgcolor:"action.selected"}}}>{depth===0?<ListItemIcon sx={{minWidth:32,color:"inherit"}}><Icon fontSize="small"/></ListItemIcon>:null}<ListItemText primary={item.label} slotProps={{primary:{sx:{fontSize:14,fontWeight:active?700:500}}}}/></ListItemButton>;
}
export function CommunitySidebar({menu,path,onNavigate,onShowTraderLink}:{menu:CommunityMenu;path:string;onNavigate:()=>void;onShowTraderLink:()=>void}){
 const selectedHref=menuLinks(menu.items).filter(item=>item.href&&(path===item.href||(item.href!==menu.base&&path.startsWith(item.href+"/")))).sort((a,b)=>(b.href?.length??0)-(a.href?.length??0))[0]?.href;
 return <Box><Button startIcon={<ArrowBackRounded/>} onClick={onShowTraderLink} sx={{mx:1,mb:1}}>TraderLink menu</Button><Box sx={{px:2,py:1.5,borderBottom:1,borderColor:"divider",mb:1}}><Typography sx={{fontWeight:800,overflowWrap:"anywhere"}}>{menu.name}</Typography>{menu.kind!=="coaching"?<Button component={Link} href="/communities" prefetch={false} onClick={onNavigate} size="small" sx={{px:0}}>Switch community</Button>:null}</Box><List disablePadding>{menu.items.map(item=><MenuRow key={item.label} item={item} path={path} base={menu.base} onNavigate={onNavigate} selectedHref={selectedHref}/>)}</List></Box>;
}

function menuLinks(items:CommunityMenuItem[]):CommunityMenuItem[]{return items.flatMap(item=>item.children?menuLinks(item.children):[item]);}
const subscribeToStatsLocation=(notify:()=>void)=>{window.addEventListener("popstate",notify);window.addEventListener("community-stats-location",notify);return()=>{window.removeEventListener("popstate",notify);window.removeEventListener("community-stats-location",notify);};};
const statsSearch=()=>window.location.search;
const emptyStatsSearch=()=>"";
export function CommunityBreadcrumbs({menu,path}:{menu:CommunityMenu;path:string}){
 const search=useSyncExternalStore(subscribeToStatsLocation,statsSearch,emptyStatsSearch);
 function find(items:CommunityMenuItem[],parents:CommunityMenuItem[]=[]):CommunityMenuItem[][]{return items.flatMap(item=>item.children?find(item.children,[...parents,item]):item.href&&(path===item.href||(item.href!==menu.base&&path.startsWith(item.href+"/")))?[[...parents,item]]:[]);}
 let trail=find(menu.items).sort((a,b)=>(b.at(-1)?.href?.length??0)-(a.at(-1)?.href?.length??0))[0]??[];
 // Only relabel the existing authorized activity leaf. This adds no menu entry or access.
 if(menu.kind!=="coaching"&&path===`${menu.base}/stats/activity`&&trail.at(-1)?.href===path){
  const query=new URLSearchParams(search),labels:Record<string,string>={overview:"Overview",server:"Server",messages:"Messages",pages:"Pages",members:"Members",publishing:"Publishing"};
  const tab=query.get("tab")??"overview",known=Object.hasOwn(labels,tab),label=known?labels[tab]:"Overview";
  query.set("tab",known?tab:"overview");query.delete("member");query.delete("memberPage");
  trail=[...trail.slice(0,-1),{label,href:`${path}?${query}`}];
  if(tab==="members"&&/^\d{1,32}$/u.test(new URLSearchParams(search).get("member")??""))trail.push({label:"Member detail"});
 }
 return <Breadcrumbs aria-label={menu.kind==="coaching"?"Coaching breadcrumb":"Community breadcrumb"} sx={{mb:2,fontSize:13,"& a":{color:"text.secondary",textDecoration:"none","&:hover":{color:"primary.main",textDecoration:"underline"}}}}><Link href={menu.base}>{menu.name}</Link>{trail.filter(item=>item.href!==menu.base).map(item=>item.href?<Link key={item.label} href={item.href}>{item.label}</Link>:<Typography key={item.label} variant="body2" color="text.secondary">{item.label}</Typography>)}</Breadcrumbs>;
}
