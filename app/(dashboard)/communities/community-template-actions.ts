"use server";
import {createHash} from "node:crypto";
import {revalidatePath} from "next/cache";
import {requireTraderLinkPlatformPageIdentity} from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import {withPlatformDatabase} from "@/src/modules/platform/server/database/open-platform-database";
import {requireCommunityRequestAccess} from "@/src/modules/communities/server/community-request-access";
import {resolveTraderLinkCommunityViewer} from "@/src/modules/communities/server/traderlink-community-viewer";
import {TraderLinkCommunityPlatformRepository} from "@/src/modules/communities/server/traderlink-community-platform-repository";
import type {CommunityPublicationFeedback} from "@/src/modules/communities/contracts/community-publication-feedback";
import type {TraderLinkCommunityAlertTemplate} from "@/src/modules/communities/contracts/traderlink-community-platform-contracts";
export async function saveCommunityTemplateWithFeedback(form:FormData):Promise<CommunityPublicationFeedback>{
 const identity=await requireTraderLinkPlatformPageIdentity();const slug=String(form.get("communitySlug")??"");
 if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))return {status:"error",message:"Community unavailable."};
 try{
  await requireCommunityRequestAccess({userId:identity.scope.userId,slug});
  const result=withPlatformDatabase({mode:"runtime"},db=>db.transaction(()=>{
   const actor=resolveTraderLinkCommunityViewer(db,identity,slug);
   const community=db.prepare(`SELECT community_id FROM traderlink_communities WHERE slug=?`).get(slug) as {community_id:string};
   const requestId=String(form.get("requestId")??"");if(!/^[0-9a-f-]{36}$/i.test(requestId))throw new Error("Invalid save request");
   const hash=createHash("sha256").update(JSON.stringify(["template",[...form.entries()].filter(([key])=>key!=="requestId")])).digest("hex");
   const previous=db.prepare(`SELECT payload_hash,result_json FROM traderlink_community_publication_receipts WHERE community_id=? AND user_id=? AND request_id=?`).get(community.community_id,actor.userId,requestId) as {payload_hash:string;result_json:string}|undefined;
   if(previous){if(previous.payload_hash!==hash)throw new Error("Changed save request");return JSON.parse(previous.result_json) as CommunityPublicationFeedback;}
   const repository=new TraderLinkCommunityPlatformRepository(db);const atUtc=new Date().toISOString();const templateId=String(form.get("templateId")??"");const operation=String(form.get("operation")??"save");
   if(operation==="archive")repository.archiveAlertTemplate({communityId:community.community_id,actor,templateId,atUtc});
   else if(operation==="restore")repository.restoreAlertTemplate({communityId:community.community_id,actor,templateId,atUtc});
   else if(operation==="save"){
    const scope=String(form.get("scope")??"");if(scope!=="personal"&&scope!=="community")throw new Error("Invalid scope");
    const count=Number(form.get("fieldCount"));if(!Number.isInteger(count)||count<1||count>20)throw new Error("Invalid fields");
    const fields=Array.from({length:count},(_,index)=>{
     const type=String(form.get(`fieldType:${index}`)??"");if(!["text","number","price","ticker","date","time","choice","notes"].includes(type))throw new Error("Invalid type");
     return {label:String(form.get(`fieldLabel:${index}`)??""),type:type as TraderLinkCommunityAlertTemplate["fields"][number]["type"],required:form.get(`fieldRequired:${index}`)==="on",placeholder:String(form.get(`fieldPlaceholder:${index}`)??"")};
    });
    repository.createAlertTemplate({communityId:community.community_id,actor,title:String(form.get("title")??""),scope,fields,replacesTemplateId:templateId||undefined,atUtc});
   }else throw new Error("Invalid action");
   const feedback:CommunityPublicationFeedback={status:"success",message:operation==="archive"?"Template archived. Existing alert content is unchanged.":operation==="restore"?"Template restored.":templateId?"Template revision saved. Earlier field definitions and alert drafts are preserved.":"Template saved."};
   db.prepare(`INSERT INTO traderlink_community_publication_receipts VALUES(?,?,?,?,?,?)`).run(community.community_id,actor.userId,requestId,hash,JSON.stringify(feedback),atUtc);return feedback;
  }).immediate());
  try{revalidatePath(`/communities/${slug}/alerts`);revalidatePath(`/communities/${slug}/manage/templates`);}catch{/* Persistence already committed. */}
  return result;
 }catch{return {status:"error",message:"We couldn't save this template. Check access and field names, or refresh if it was already revised. Your entries are retained."};}
}
