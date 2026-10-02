import { withJournalAdminRequest, journalAdminJson, journalAdminUnavailable } from "../admin-route-runtime";
import { requireJournalAdminMutationRequest } from "@/src/modules/platform/server/administration/platform-admin-request-security";
import { SwingPlanStore, SwingPlanConflict } from "@/src/modules/swings/server/swing-plan-store";
import { getFinnhubCompanyProfile } from "@/src/lib/news/finnhub-company-profile";
import { validateSwingPlan } from "@/src/modules/swings/swing-plan-contract";
import { readSwingPlanRequest, SwingPlanInputError } from "@/src/modules/swings/server/swing-plan-request";
import { originalSwingPlanDraft } from '@/src/modules/swings/server/swing-plan-original';

export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(request:Request){
  try{return withJournalAdminRequest(request,db=>{
    const store=new SwingPlanStore(db),id=new URL(request.url).searchParams.get("id");
    return journalAdminJson(id?{plan:store.draft(id),history:store.history(id)}:{plans:store.list()});
  });}catch(error){return journalAdminUnavailable(error);}
}
export async function POST(request:Request){
  try{
    requireJournalAdminMutationRequest(request);
    // Authorize before reading potentially large private content or making provider requests.
    withJournalAdminRequest(request,()=>true);
    const b=await readSwingPlanRequest(request,3400000);
    if(!b||typeof b!=="object")return journalAdminJson({error:"Invalid plan request."},400);
    if(b.action==='save'){
      try{b.document=validateSwingPlan(b.document);}catch(e){return journalAdminJson({error:e instanceof Error?e.message:'Invalid plan content.'},400);}
      if(typeof b.version!=='number'||!Number.isInteger(b.version)||b.version<0||b.id!==undefined&&typeof b.id!=='string')return journalAdminJson({error:'Invalid saved version.'},400);
    }
    if(b.action==="company"){
      if(typeof b.ticker!=="string"||!/^[A-Z0-9][A-Z0-9.-]{0,14}$/.test(b.ticker))return journalAdminJson({error:"Enter a valid ticker."},400);
      const profile=await getFinnhubCompanyProfile(b.ticker);
      return journalAdminJson({profile,fetchedAt:Date.now()});
    }
    return withJournalAdminRequest(request,(db,scope)=>{
      const store=new SwingPlanStore(db);
      if(b.action==='import-original')return journalAdminJson({plan:store.importOriginal(originalSwingPlanDraft(),scope.userId)});
      if(b.action==="save")return journalAdminJson({plan:store.save({id:b.id as string|undefined,expectedVersion:b.version as number,document:b.document,actor:scope.userId})});
      if(b.action==="publish"&&typeof b.id==="string"&&typeof b.version==='number'&&Number.isInteger(b.version))return journalAdminJson({publication:store.publish(b.id,b.version)});
      return journalAdminJson({error:"Unknown plan action."},400);
    });
  }catch(error){
    if(error instanceof SwingPlanConflict)return journalAdminJson({error:error.message},409);
    if(error instanceof SwingPlanInputError)return journalAdminJson({error:error.message},400);
    // Never reflect database errors, private content, configuration or provider URLs.
    return journalAdminUnavailable(error);
  }
}
