import {constants as bufferConstants} from "node:buffer";
import {closeSync,constants,fstatSync,lstatSync,openSync,readSync,realpathSync} from "node:fs";
import {dirname} from "node:path";

type Identity=ReturnType<typeof stat>;
type Hooks=Readonly<{afterInitialIdentity?:()=>void;afterOpen?:()=>void;afterChunk?:(count:number,total:number)=>void;afterRead?:()=>void;close?:(descriptor:number)=>void}>;
const KEYS=["dev","ino","size","mode","nlink","mtimeNs","ctimeNs"] as const;
function stat(descriptor:number){return fstatSync(descriptor,{bigint:true});}
function named(path:string){return lstatSync(path,{bigint:true});}
function same(left:Identity,right:Identity){return KEYS.every(key=>left[key]===right[key]);}
function sameDirectory(left:Identity,right:Identity){return left.dev===right.dev&&left.ino===right.ino&&left.mode===right.mode&&left.nlink===right.nlink;}

/** @internal Reads one private ledger through a pinned canonical parent. Hooks
 * exist only for deterministic filesystem controls; production passes none. */
export function readPartnerAlertTombstoneLedgerBytes(path:string,root:string,maximum:number,hooks:Hooks={}):Buffer{
 if(!Number.isSafeInteger(maximum)||maximum<=0||maximum>=bufferConstants.MAX_LENGTH)throw new Error("partner_alert_tombstone_ledger_size");
 const parent=dirname(path),rootInitial=named(root),parentInitial=named(parent);
 if(!rootInitial.isDirectory()||rootInitial.isSymbolicLink()||!parentInitial.isDirectory()||parentInitial.isSymbolicLink()||realpathSync(root)!==root||realpathSync(parent)!==root||!sameDirectory(rootInitial,parentInitial))throw new Error("partner_alert_tombstone_ledger_link");
 const initial=named(path);if(!initial.isFile()||initial.isSymbolicLink()||initial.nlink!==BigInt(1)||Number(initial.mode&BigInt(0o077))!==0)throw new Error("partner_alert_tombstone_ledger_permissions");hooks.afterInitialIdentity?.();
 let descriptor:number|undefined,primary:unknown,result:Buffer|undefined;
 try{descriptor=openSync(path,constants.O_RDONLY|constants.O_NOFOLLOW);const before=stat(descriptor);if(!before.isFile()||before.nlink!==BigInt(1)||Number(before.mode&BigInt(0o077))!==0)throw new Error("partner_alert_tombstone_ledger_permissions");if(!same(initial,before))throw new Error("partner_alert_tombstone_ledger_link");if(before.size>BigInt(maximum))throw new Error("partner_alert_tombstone_ledger_size");hooks.afterOpen?.();const destination=Buffer.allocUnsafe(maximum+1);let total=0;for(;;){const count=readSync(descriptor,destination,total,maximum+1-total,total);if(!count)break;total+=count;hooks.afterChunk?.(count,total);if(total>maximum)throw new Error("partner_alert_tombstone_ledger_size");}hooks.afterRead?.();const after=stat(descriptor),final=named(path),rootFinal=named(root),parentFinal=named(parent);if(BigInt(total)!==after.size||!same(before,after)||!same(initial,final)||!same(after,final)||!sameDirectory(rootInitial,rootFinal)||!sameDirectory(parentInitial,parentFinal)||!sameDirectory(rootFinal,parentFinal)||rootFinal.isSymbolicLink()||parentFinal.isSymbolicLink()||realpathSync(root)!==root||realpathSync(parent)!==root)throw new Error("partner_alert_tombstone_ledger_link");result=destination.subarray(0,total);}catch(error){primary=error;}finally{if(descriptor!==undefined)try{(hooks.close??closeSync)(descriptor);}catch(error){primary=primary===undefined?error:new AggregateError([primary,error],"partner tombstone ledger read/close failures");}}if(primary!==undefined)throw primary;return result!;
}
