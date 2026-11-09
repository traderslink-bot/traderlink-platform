/** Small runtime-local metadata cache, including in-flight coalescing. No failures cached. */
export function coalescedMetadata<TArgs extends readonly unknown[],T>(load:(...args:TArgs)=>Promise<T>,ttlMs:number,key:(...args:TArgs)=>string=()=>'',maximum=8){
  const cache=new Map<string,{until:number;value:T}>(),pending=new Map<string,Promise<T>>();
  return (...args:TArgs):Promise<T>=>{
    const id=key(...args),hit=cache.get(id);if(hit&&hit.until>Date.now())return Promise.resolve(hit.value);
    const inflight=pending.get(id);if(inflight)return inflight;
    const work=load(...args).then(value=>{cache.delete(id);cache.set(id,{until:Date.now()+ttlMs,value});while(cache.size>maximum)cache.delete(cache.keys().next().value!);return value;}).finally(()=>pending.delete(id));
    pending.set(id,work);return work;
  };
}
