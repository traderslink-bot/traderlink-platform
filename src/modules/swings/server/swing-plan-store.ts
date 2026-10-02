import 'server-only';
import { randomBytes, randomUUID } from "node:crypto";
import type Database from "better-sqlite3";
import { SwingPlanInputError } from "./swing-plan-request";
import { SWING_IDEA } from '../swing-idea-catalog';
import { containsSwingTicker, validateSwingPlan, type SwingPlanDocument, type SwingPublicTeaser } from "../swing-plan-contract";

type PlanRow={idea_id:string;slug:string;draft_json:string;draft_version:number;published_revision:number|null;public_teaser_json:string|null;created_at_ms:number;updated_at_ms:number};
export type SwingPlanSummary={id:string;slug:string;ticker:string;title:string;draftVersion:number;publishedVersion:number|null;status:"open"|"closed";updatedAt:number};
export class SwingPlanConflict extends Error { constructor(){super("This plan was saved in another tab. Your edits are still here; reload the saved version before replacing it.");} }
export class SwingPlanStore {
  constructor(private db:Database.Database){}
  importOriginal(document:SwingPlanDocument,actor:string){return this.db.transaction(()=>{
    const existing=this.draft(SWING_IDEA.id);if(existing)return existing;
    const json=JSON.stringify(validateSwingPlan(document)),now=Date.now();
    this.db.prepare('INSERT INTO platform_swing_plans(idea_id,slug,draft_json,draft_version,created_at_ms,updated_at_ms) VALUES(?,?,?,1,?,?)').run(SWING_IDEA.id,SWING_IDEA.slug,json,now,now);
    this.db.prepare('INSERT INTO platform_swing_plan_versions(idea_id,version,document_json,saved_at_ms,actor_user_id) VALUES(?,1,?,?,?)').run(SWING_IDEA.id,json,now,actor);
    return this.draft(SWING_IDEA.id)!;
  })();}
  private row(id:string){return this.db.prepare("SELECT * FROM platform_swing_plans WHERE idea_id=? OR slug=?").get(id,id) as PlanRow|undefined;}
  list():SwingPlanSummary[]{return (this.db.prepare("SELECT * FROM platform_swing_plans ORDER BY updated_at_ms DESC LIMIT 500").all() as PlanRow[]).map(r=>{
    const d=JSON.parse(r.draft_json) as SwingPlanDocument;return {id:r.idea_id,slug:r.slug,ticker:d.ticker,title:d.title,draftVersion:r.draft_version,publishedVersion:r.published_revision,status:d.status,updatedAt:r.updated_at_ms};});}
  draft(id:string){const r=this.row(id);return r?{id:r.idea_id,slug:r.slug,version:r.draft_version,publishedVersion:r.published_revision,document:JSON.parse(r.draft_json) as SwingPlanDocument,publishedDocument:this.published(r.idea_id)?.document??null}:null;}
  /** Public columns only: never read research when resolving metadata or a locked page. */
  publicInfo(id:string){const r=this.db.prepare("SELECT idea_id,slug,published_revision,public_teaser_json FROM platform_swing_plans WHERE (idea_id=? OR slug=?) AND published_revision IS NOT NULL").get(id,id) as Pick<PlanRow,"idea_id"|"slug"|"published_revision"|"public_teaser_json">|undefined;
    return r?{id:r.idea_id,slug:r.slug,version:r.published_revision!,teaser:JSON.parse(r.public_teaser_json!) as SwingPublicTeaser}:null;}
  /** Caller must authorize Premium access or owner scope before invoking. */
  published(id:string){const p=this.publicInfo(id);if(!p)return null;const r=this.db.prepare("SELECT document_json FROM platform_swing_plan_versions WHERE idea_id=? AND version=?").get(p.id,p.version) as {document_json:string};return {...p,document:JSON.parse(r.document_json) as SwingPlanDocument};}
  save(input:{id?:string;expectedVersion:number;document:unknown;actor:string;now?:number}){
    const d=validateSwingPlan(input.document),now=input.now??Date.now(),json=JSON.stringify(d);
    return this.db.transaction(()=>{
      let r=input.id?this.row(input.id):undefined;
      if(input.id&&!r)throw Error("Plan not found.");
      if(r&&r.draft_version!==input.expectedVersion)throw new SwingPlanConflict();
      if(!r){
        if(input.expectedVersion!==0)throw new SwingPlanConflict();
        const id=randomBytes(16).toString("hex"),slug=randomBytes(4).toString("hex");
        this.db.prepare("INSERT INTO platform_swing_plans(idea_id,slug,draft_json,draft_version,created_at_ms,updated_at_ms) VALUES(?,?,?,1,?,?)").run(id,slug,json,now,now);
        r=this.row(id)!;
      }else{
        this.db.prepare("UPDATE platform_swing_plans SET draft_json=?,draft_version=draft_version+1,updated_at_ms=? WHERE idea_id=?").run(json,now,r.idea_id);
        r=this.row(r.idea_id)!;
      }
      this.db.prepare("INSERT INTO platform_swing_plan_versions(idea_id,version,document_json,saved_at_ms,actor_user_id) VALUES(?,?,?,?,?)").run(r.idea_id,r.draft_version,json,now,input.actor);
      return this.draft(r.idea_id)!;
    })();
  }
  publish(id:string,expectedVersion:number){return this.db.transaction(()=>{
    const r=this.row(id);if(!r)throw Error("Plan not found.");
    if(r.draft_version!==expectedVersion)throw new SwingPlanConflict();
    const d=validateSwingPlan(JSON.parse(r.draft_json));
    if(!d.ticker.trim()||!d.title.trim())throw new SwingPlanInputError("Add the ticker and plan title before publishing.");
    if(Object.values(d.teaser).some(text=>containsSwingTicker(text,d.ticker)))throw new SwingPlanInputError("Remove the ticker from the public teaser before publishing; free visitors can see it.");
    const prior=this.db.prepare("SELECT publication_id FROM platform_swing_plan_publications WHERE idea_id=? AND version=?").get(r.idea_id,r.draft_version) as {publication_id:string}|undefined;
    const publicationId=prior?.publication_id??randomUUID();
    if(!prior)this.db.prepare("INSERT INTO platform_swing_plan_publications VALUES(?,?,?,?)").run(publicationId,r.idea_id,r.draft_version,Date.now());
    this.db.prepare("UPDATE platform_swing_plans SET published_revision=?,public_teaser_json=? WHERE idea_id=?").run(r.draft_version,JSON.stringify(d.teaser),r.idea_id);
    return {publicationId,...this.publicInfo(r.idea_id)!};
  })();}
  history(id:string){return this.db.prepare("SELECT v.version,v.saved_at_ms,p.published_at_ms FROM platform_swing_plan_versions v LEFT JOIN platform_swing_plan_publications p ON p.idea_id=v.idea_id AND p.version=v.version WHERE v.idea_id=? ORDER BY v.version DESC LIMIT 100").all(id);}
}
