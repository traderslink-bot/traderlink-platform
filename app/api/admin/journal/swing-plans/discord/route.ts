import { withJournalAdminRequest, journalAdminJson, journalAdminUnavailable } from "../../admin-route-runtime";
import { requireJournalAdminMutationRequest } from "@/src/modules/platform/server/administration/platform-admin-request-security";
import { previewSwingPost, sendSwingPost, swingDeliveryStatus, resolveSwingDelivery } from "@/src/modules/swings/server/swing-plan-discord";
import { readSwingPlanRequest, SwingPlanInputError } from "@/src/modules/swings/server/swing-plan-request";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function POST(request:Request){
  try{
    requireJournalAdminMutationRequest(request);withJournalAdminRequest(request,()=>true);
    const b=await readSwingPlanRequest(request,40000);
    if(b.deliveryId!==undefined&&typeof b.deliveryId!=='string')return journalAdminJson({error:'Invalid delivery.'},400);
    if(b.action==='resolve'&&typeof b.id==='string'&&typeof b.deliveryId==='string'&&typeof b.posted==='boolean')return journalAdminJson({...resolveSwingDelivery(b.id,b.deliveryId,b.posted),deliveries:swingDeliveryStatus(b.id)});
    if(typeof b.id!=="string"||(b.channel!=='premium'&&b.channel!=='free')||typeof b.comment!=="string")return journalAdminJson({error:"Invalid post."},400);
    try{
      if(b.action==='preview')return journalAdminJson({preview:previewSwingPost(b.id,b.channel,b.comment,b.deliveryId as string|undefined),deliveries:swingDeliveryStatus(b.id)});
      if(b.action==='send'&&typeof b.publicationId==='string')return journalAdminJson({...await sendSwingPost(b.id,b.channel,b.comment,b.publicationId,b.deliveryId as string|undefined),deliveries:swingDeliveryStatus(b.id)});
      return journalAdminJson({error:"Unknown action."},400);
    }catch(error){
      if(error instanceof SwingPlanInputError)return journalAdminJson({error:error.message},400);
      return journalAdminJson({error:"Delivery status could not be confirmed. Check delivery history before trying again."},503);
    }
  }catch(error){if(error instanceof SwingPlanInputError)return journalAdminJson({error:error.message},400);return journalAdminUnavailable(error);}
}
