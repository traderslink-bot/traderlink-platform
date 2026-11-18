import {createHash,createHmac} from "node:crypto";

/** Raw captured claim bytes. Do not route through Core's JSON-value digest. */
export const rawPartnerClaimSha256=(originalJson:string):string=>
  createHash("sha256").update(originalJson,"utf8").digest("hex");

export const partnerGuardDomainHmac=(key:Uint8Array,domain:string,value:string):string=>
  createHmac("sha256",key).update(Buffer.concat([Buffer.from(domain,"utf8"),Buffer.from([0]),Buffer.from(value,"utf8")])).digest("hex");

export const samePartnerGuardNamedValues=(actual:Readonly<Record<string,unknown>>,expected:Readonly<Record<string,unknown>>):boolean=>{
  const left=Object.keys(actual).sort(),right=Object.keys(expected).sort();
  return JSON.stringify(left)===JSON.stringify(right)&&right.every(key=>actual[key]===expected[key]);
};
