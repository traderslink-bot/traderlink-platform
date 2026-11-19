import type Database from "better-sqlite3";
import {requirePlatformErasureWriter} from "../../platform/server/privacy/platform-erasure-admission";

type Binding=Readonly<{keyRef:string;key:Uint8Array}>;
/** Operation-level Partner entry. All evidence validation and the fixed delete live in Core's sole gated method. */
export class PartnerAlertIdentifyingOriginalPurger {
 constructor(private readonly database:Database.Database,private readonly binding:Binding){}
 purge(operationRef:string,userId:string):number {
  return requirePlatformErasureWriter(this.database).purgePartnerIdentifyingSources({operationRef,userId,binding:this.binding});
 }
}
