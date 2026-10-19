"use client";
import Box from "@mui/material/Box";
import {useEffect,useRef,useState,type ChangeEvent} from "react";
import type {CommunityStatsTableRow} from "@/src/modules/communities/contracts/community-stats-contracts";
import {communityStatsPresentation} from "./community-stats-presentation";
import {CommunityStatsTable} from "./community-stats-tables";

type Settings={discordEnabled:boolean;channelIds:string[];ownContentUserIds:string[];exportUserIds:string[]};
type Choice={id:string;name:string};
export function CommunityStatsSettings({communitySlug}:{communitySlug:string}){
  const [settings,setSettings]=useState<Settings|null>(null),[message,setMessage]=useState(""),[saving,setSaving]=useState(false),[channels,setChannels]=useState<Choice[]>([]),[members,setMembers]=useState<(Choice&{publisher:boolean})[]>([]),[runtimeEnabled,setRuntimeEnabled]=useState(false);
  const [audits,setAudits]=useState<CommunityStatsTableRow[]>([]),[auditCount,setAuditCount]=useState(0),[settingsPage,setSettingsPage]=useState(1);
  const loaded=useRef(false);const [revision,setRevision]=useState<number|null>(null),[choicesRefresh,setChoicesRefresh]=useState(0);
  useEffect(()=>{
    const controller=new AbortController();
    void fetch(`/api/communities/${encodeURIComponent(communitySlug)}/stats?settings=1&settingsPage=${settingsPage}`,{signal:controller.signal,cache:"no-store"}).then(async response=>{if(!response.ok)throw new Error();return response.json();}).then(data=>{
      if(controller.signal.aborted)return;const value=data.settings;
      if(!loaded.current){setRevision(value?.revision??null);loaded.current=true;setSettings({discordEnabled:value?.discord_enabled===1,channelIds:JSON.parse(value?.channel_ids_json??"[]"),ownContentUserIds:JSON.parse(value?.own_content_user_ids_json??"[]"),exportUserIds:JSON.parse(value?.export_user_ids_json??"[]")});}
      setChannels(data.channels.map((channel:{channel_id:string;name:string})=>({id:channel.channel_id,name:channel.name})));setMembers(data.members);setRuntimeEnabled(data.runtimeEnabled);setAudits(data.audits);setAuditCount(data.auditCount);
    }).catch(error=>{if(error.name!=="AbortError")setMessage("Settings are unavailable.");});
    return()=>controller.abort();
  },[communitySlug,choicesRefresh,settingsPage]);
  async function save(retryConnection=false){
    if(!settings)return;setSaving(true);setMessage("");
    try{const response=await fetch(`/api/communities/${encodeURIComponent(communitySlug)}/stats`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...settings,retryConnection,expectedRevision:revision})});if(response.status===409){setMessage("Settings changed in another window. Reload this page before saving; your entries are still here.");return;}if(!response.ok)throw new Error();const saved=await response.json();setRevision(saved.revision);setMessage("Settings saved.");setChoicesRefresh(value=>value+1);}
    catch{setMessage("Settings could not be saved. A selected member or publishing permission may have changed.");}finally{setSaving(false);}
  }
  const selections=(event:ChangeEvent<HTMLSelectElement>)=>Array.from(event.target.selectedOptions,option=>option.value);
  return <Box sx={communityStatsPresentation}><div className="cs-title"><h1>Settings</h1></div><section className="cs-panel"><div className="cs-panel-head"><button className="cs-action" type="button" disabled={saving} onClick={()=>setChoicesRefresh(value=>value+1)}>Refresh choices</button></div>{settings?<form onSubmit={event=>{event.preventDefault();void save();}}>
    <div className="cs-controls"><label className="cs-field">Discord collection<select value={settings.discordEnabled?"enabled":"disabled"} onChange={event=>setSettings({...settings,discordEnabled:event.target.value==="enabled"})}><option value="disabled">Disabled</option><option value="enabled">Enabled</option></select></label>
      <label className="cs-field">Public Discord channels<select multiple size={5} value={settings.channelIds} onChange={event=>setSettings({...settings,channelIds:selections(event)})}>{channels.map(channel=><option key={channel.id} value={channel.id}>{channel.name}</option>)}{settings.channelIds.filter(id=>!channels.some(channel=>channel.id===id)).map(id=><option key={id} value={id}>Unavailable channel · {id.slice(-4)}</option>)}</select></label>
      <label className="cs-field">Own-content Stats<select multiple size={5} value={settings.ownContentUserIds} onChange={event=>setSettings({...settings,ownContentUserIds:selections(event)})}>{members.filter(member=>member.publisher).map(member=><option key={member.id} value={member.id}>{member.name}</option>)}{settings.ownContentUserIds.filter(id=>!members.some(member=>member.id===id&&member.publisher)).map(id=><option key={id} value={id}>Unavailable publisher · {id.slice(-4)}</option>)}</select></label>
      <label className="cs-field">Report exports<select multiple size={5} value={settings.exportUserIds} onChange={event=>setSettings({...settings,exportUserIds:selections(event)})}>{members.map(member=><option key={member.id} value={member.id}>{member.name}</option>)}{settings.exportUserIds.filter(id=>!members.some(member=>member.id===id)).map(id=><option key={id} value={id}>Unavailable member · {id.slice(-4)}</option>)}</select></label>
    </div><p className="cs-note">Only selected public channels are collected. Select people for each permission; Ctrl or Command selects multiple entries. These grants do not grant named-member access or publishing rights.</p>
    {!runtimeEnabled?<p className="cs-note">Collection is awaiting operator activation.</p>:!channels.length?<p className="cs-note">Enable collection and save to connect Discord. Refresh settings when the connection is ready to choose public channels.</p>:null}
    <button className="cs-action" disabled={saving}>{saving?"Saving…":"Save settings"}</button> <button className="cs-action" type="button" disabled={saving||!settings.discordEnabled||!runtimeEnabled} onClick={()=>void save(true)}>Reconnect Discord</button>
  </form>:<p className="cs-note">{message||"Loading settings…"}</p>}<p role="status" className="cs-note">{message}</p><details style={{marginTop:16}}><summary>Settings history</summary><CommunityStatsTable columns={["Changed UTC","Actor","Revision","Collection","Channels","Own-content grants","Export grants"]} rows={audits}/><div className="cs-pager"><button className="cs-action" disabled={settingsPage<=1} onClick={()=>setSettingsPage(value=>value-1)}>Previous changes</button><span className="cs-note">{auditCount} changes</span><button className="cs-action" disabled={settingsPage*25>=auditCount} onClick={()=>setSettingsPage(value=>value+1)}>Next changes</button></div></details></section></Box>;
}
