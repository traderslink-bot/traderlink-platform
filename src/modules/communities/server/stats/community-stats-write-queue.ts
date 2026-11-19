import "server-only";
import type Database from "better-sqlite3";
import {setImmediate as yieldToEvents} from "node:timers/promises";
import {tryNonblockingSqliteWrite} from "../../../platform/server/database/nonblocking-sqlite-write";
import type {CommunityStagingQaCapability} from "../community-staging-qa-capability";

type WriteOptions=Readonly<{
  assertCurrent?:()=>void;
  revalidate?:()=>void;
  /** Capture only mutable local state; SQL rollback is owned by the attempt. */
  captureRollback?:()=>()=>void;
}>;
type Job={operation:()=>unknown;options:WriteOptions;resolve:(value:unknown)=>void;reject:(error:unknown)=>void;attempts:number};
const queues=new WeakMap<Database.Database,CommunityStatsWriteQueue>();

/** One FIFO for all Stats writers sharing a handle. Busy work stays at its head. */
export class CommunityStatsWriteQueue{
  private jobs:Job[]=[];
  private running=false;
  private retry:ReturnType<typeof setTimeout>|null=null;
  private effects:(()=>void)[]|null=null;
  private idle:(()=>void)[]=[];
  constructor(private readonly db:Database.Database){}
  get pending():number{return this.jobs.length;}
  get inAttempt():boolean{return this.effects!==null;}
  afterCommit(effect:()=>void):void{if(this.effects)this.effects.push(effect);else effect();}
  write<T>(operation:()=>T,options:WriteOptions={}):Promise<T>{
    const result=new Promise<T>((resolve,reject)=>this.jobs.push({operation,options,resolve:value=>resolve(value as T),reject,attempts:0}));
    void this.pump();return result;
  }
  whenIdle():Promise<void>{return this.jobs.length||this.running?new Promise(resolve=>this.idle.push(resolve)):Promise.resolve();}
  private async pump():Promise<void>{
    if(this.running||this.retry)return;
    this.running=true;
    try{
      while(this.jobs.length){
        const job=this.jobs[0];let rollback:(()=>void)|undefined;
        const committedEffects:(()=>void)[]=[];
        try{
          job.options.assertCurrent?.();
          const attempt=tryNonblockingSqliteWrite(this.db,()=>{
            rollback=job.options.captureRollback?.();this.effects=committedEffects;
            try{return job.operation();}finally{this.effects=null;}
          },{revalidate:job.options.revalidate});
          if(attempt.kind==="busy"){
            // Core guarantees a busy result means BEGIN failed and neither
            // validation nor operation ran. Never replay a callback/COMMIT error.
            const delay=Math.min(1000,25*2**Math.min(job.attempts++,5));
            this.retry=setTimeout(()=>{this.retry=null;void this.pump();},delay);
            return;
          }
          this.jobs.shift();
          // Never retry a committed SQL operation because a later effect fails.
          for(const effect of committedEffects){try{effect();}catch(error){console.error("Stats post-commit action deferred.",{errorName:error instanceof Error?error.name:"UnknownError"});}}
          job.resolve(attempt.value);
        }catch(error){
          this.effects=null;rollback?.();
          this.jobs.shift();job.reject(error);
        }
        // A drained backlog must also yield to heartbeats and ordinary HTTP.
        await yieldToEvents();
      }
    }finally{
      this.running=false;
      if(!this.jobs.length){for(const resolve of this.idle.splice(0))resolve();}
    }
  }
}
export function communityStatsWrites(db:Database.Database):CommunityStatsWriteQueue{
  let queue=queues.get(db);if(!queue){queue=new CommunityStatsWriteQueue(db);queues.set(db,queue);}return queue;
}
/** Full native review checks require no active transaction. Preserve that
 * boundary before every acquisition; keep the original deadline inside it too. */
export function statsWriteReview(review?:CommunityStagingQaCapability):WriteOptions{
  return {assertCurrent:()=>review?.assertActive(),revalidate:()=>{
    if(review&&(review.signal.aborted||review.remainingMs()<=0))throw new Error("Stats review authority expired.");
  }};
}
