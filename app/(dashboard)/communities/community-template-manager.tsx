"use client";
import {useState} from "react";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import {DashboardPanel} from "@/app/dashboard-ui";
import {CommunityAlertTemplateBuilder} from "./community-alert-template-builder";
import {CommunityPublicationForm} from "./community-publication-form";
import {saveCommunityTemplateWithFeedback} from "./community-template-actions";
import type {TraderLinkCommunityDashboardSnapshot,TraderLinkCommunityAlertTemplate} from "@/src/modules/communities/contracts/traderlink-community-platform-contracts";
export function CommunityTemplateManager({snapshot,scope,isReview}:{snapshot:TraderLinkCommunityDashboardSnapshot;scope:"personal"|"community";isReview:boolean}){
 const [editing,setEditing]=useState<TraderLinkCommunityAlertTemplate|null>(null);const [adding,setAdding]=useState(false);
 const templates=snapshot.alertTemplates.filter(item=>item.scope===scope&&(scope==="community"||item.ownerUserId===snapshot.viewer.userId));
 const canCreate=scope==="community"?snapshot.viewer.capabilities.includes("community.alerts.manage_all"):snapshot.settings.personalAlertTemplatesEnabled||snapshot.community.isOwner;
 return <DashboardPanel title={scope==="community"?"Alert templates":"My templates"}><Stack spacing={2}>
 {templates.map(template=><Stack key={template.templateId} spacing={1} sx={{border:1,borderColor:"divider",borderRadius:2,p:2}}><Typography sx={{fontWeight:800}}>{template.title}</Typography><Typography color="text.secondary">{template.status} · {template.fields.map(field=>field.label).join(", ")}</Typography><Stack direction="row" spacing={1}>{template.status==="active"?<Button disabled={isReview} onClick={()=>{setEditing(template);setAdding(false);}}>Edit</Button>:null}<CommunityPublicationForm action={saveCommunityTemplateWithFeedback} disabled={isReview}><input name="communitySlug" type="hidden" value={snapshot.community.slug}/><input name="templateId" type="hidden" value={template.templateId}/><input name="operation" type="hidden" value={template.status==="active"?"archive":"restore"}/><Button type="submit" color={template.status==="active"?"error":"primary"}>{template.status==="active"?"Archive":"Restore"}</Button></CommunityPublicationForm></Stack></Stack>)}
 {!templates.length?<Typography>No templates yet.</Typography>:null}<Button disabled={isReview||!canCreate} onClick={()=>{setAdding(true);setEditing(null);}}>Create template</Button>
 {adding||editing?<Stack spacing={2}><CommunityAlertTemplateBuilder key={editing?.templateId??"new"} communitySlug={snapshot.community.slug} scope={scope} template={editing??undefined} canShare={scope==="community"} disabled={isReview}/><Button onClick={()=>{setAdding(false);setEditing(null);}}>Close editor</Button></Stack>:null}
 </Stack></DashboardPanel>;
}
