import type Database from 'better-sqlite3';
import type {AccountScope} from '../../platform/contracts/workspace-access-scope';
import type {IndependentCoachingTradeIdentity} from '../contracts/independent-coaching-trade-selection';

type SavedSelection = Readonly<{roundTripId:string;logicalTradeId:string}>;
type PhysicalResolution = Readonly<{ids:ReadonlySet<string>;groups:ReadonlySet<number>;invalid:boolean}>;
type SelectionBinding = {selection:SavedSelection;group:number|null;implicated:Set<number>;invalid:boolean};
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const MAX_IDENTITIES = 4096;

/** Read bindings only: never replace a saved selection's feedback/image/CAS key. */
export function resolveIndependentCoachingSelectedTrades<T extends IndependentCoachingTradeIdentity>(
  database:Database.Database,
  account:Pick<AccountScope,'workspaceId'|'accountId'>,
  selections:readonly SavedSelection[],
  trades:readonly T[],
):readonly (T & {reviewSelectionAliases:{matched:readonly string[];blocked:readonly string[]}})[] {
  if(selections.length>500)throw new Error('The saved trade selection cannot be resolved safely.');
  const currentById=new Map<string,Set<number>>(),currentByMember=new Map<string,Set<number>>();
  const index=(map:Map<string,Set<number>>,id:string,group:number)=>{
    const ids=map.get(id)??new Set<number>();ids.add(group);map.set(id,ids);
  };
  trades.forEach((trade,group)=>{
    index(currentById,trade.roundTripId,group);
    if(trade.logicalTradeId)index(currentById,trade.logicalTradeId,group);
    for(const member of trade.memberIds){index(currentByMember,member,group);index(currentById,member,group);}
  });
  if(!selections.length)return trades.map(trade=>({...trade,reviewSelectionAliases:{matched:[],blocked:[]}}));

  // Each lookup is restricted to the already authorized Journal account.
  // Keep every recorded member of the saved logical unit, not just a surviving representative.
  const memberQuery=database.prepare(`SELECT DISTINCT member.round_trip_id AS roundTripId, logical.lifecycle_state AS lifecycleState
FROM journal_logical_trades logical
JOIN journal_logical_trade_versions version
 ON version.workspace_id=logical.workspace_id AND version.account_id=logical.account_id
 AND version.logical_trade_id=logical.logical_trade_id
JOIN journal_logical_trade_version_members member
 ON member.workspace_id=version.workspace_id AND member.account_id=version.account_id
 AND member.logical_trade_id=version.logical_trade_id
 AND member.logical_trade_version_id=version.logical_trade_version_id
WHERE logical.workspace_id=? AND logical.account_id=? AND logical.logical_trade_id=?
ORDER BY member.round_trip_id LIMIT 4097`);
  const successorQuery=database.prepare(`SELECT DISTINCT target.round_trip_id AS roundTripId
FROM journal_round_trip_identity_aliases source
JOIN journal_round_trip_identity_aliases target
 ON target.round_trip_alias_id=source.superseded_by_alias_id
 AND target.workspace_id=source.workspace_id AND target.account_id=source.account_id
WHERE source.workspace_id=? AND source.account_id=? AND source.round_trip_id=?
ORDER BY target.round_trip_id LIMIT 4097`);
  const memberCache=new Map<string,readonly string[]|null>(),successorCache=new Map<string,readonly string[]>();
  const physicalCache=new Map<string,PhysicalResolution>(),unavailableLogicalIds=new Set<string>();
  const members=(id:string):readonly string[]|null=>{
    if(typeof id!=='string'||!UUID.test(id))return null;
    if(memberCache.has(id))return memberCache.get(id)!;
    const rows=memberQuery.all(account.workspaceId,account.accountId,id) as {roundTripId:string;lifecycleState:string}[];
    if(rows.length>MAX_IDENTITIES)throw new Error('The selected Journal trade history is too large to resolve safely.');
    if(rows.some(row=>!['active','retired'].includes(row.lifecycleState)))unavailableLogicalIds.add(id);
    const result=rows.length?rows.map(row=>row.roundTripId):null;memberCache.set(id,result);return result;
  };
  const successors=(id:string):readonly string[]=>{
    if(successorCache.has(id))return successorCache.get(id)!;
    if(successorCache.size>=MAX_IDENTITIES)throw new Error('The selected Journal trade history is too large to resolve safely.');
    const rows=successorQuery.all(account.workspaceId,account.accountId,id) as {roundTripId:string}[];
    if(rows.length>MAX_IDENTITIES)throw new Error('The selected Journal trade history is too large to resolve safely.');
    // Reprojection can supersede an alias while preserving its raw round-trip ID.
    const result=rows.map(row=>row.roundTripId).filter(next=>next!==id);successorCache.set(id,result);return result;
  };
  const resolvePhysical=(start:string):PhysicalResolution=>{
    const cached=physicalCache.get(start);if(cached)return cached;
    const ids=new Set<string>(),visiting=new Set<string>(),groups=new Set<number>();let invalid=false;
    const stack:{id:string;exit:boolean}[]=[{id:start,exit:false}];
    while(stack.length){
      const frame=stack.pop()!;
      if(frame.exit){visiting.delete(frame.id);ids.add(frame.id);continue;}
      if(visiting.has(frame.id)){invalid=true;continue;}
      if(ids.has(frame.id))continue;
      if(!UUID.test(frame.id)){invalid=true;continue;}
      if(ids.size+visiting.size>=MAX_IDENTITIES)throw new Error('The selected Journal trade history is too large to resolve safely.');
      visiting.add(frame.id);
      const currentGroups=currentByMember.get(frame.id)??new Set<number>();
      const nextIdentities=successors(frame.id);
      // A unique aggregate group must not hide another unresolved terminal branch.
      if(!currentGroups.size&&!nextIdentities.length)invalid=true;
      for(const group of currentGroups)groups.add(group);
      stack.push({id:frame.id,exit:true});
      for(const next of nextIdentities)stack.push({id:next,exit:false});
    }
    const result={ids,groups,invalid};physicalCache.set(start,result);return result;
  };
  const intersects=(left:ReadonlySet<string>,right:ReadonlySet<string>)=>[...left].some(id=>right.has(id));
  const bindings:SelectionBinding[]=selections.map(selection=>{
    const implicated=new Set<number>();
    for(const id of [selection.roundTripId,selection.logicalTradeId])for(const group of currentById.get(id)??[])implicated.add(group);
    const logical=selection.logicalTradeId;
    const fallback=typeof logical==='string'&&logical.startsWith('round-trip:')?logical.slice('round-trip:'.length):null;
    const unit=fallback!==null?(UUID.test(fallback)?[fallback]:null):members(logical);
    const selected=selection.roundTripId===logical?unit:UUID.test(selection.roundTripId)?members(selection.roundTripId)??[selection.roundTripId]:null;
    const unitEvidence=(unit??[]).map(resolvePhysical),selectedEvidence=(selected??[]).map(resolvePhysical);
    const evidence=[...unitEvidence,...selectedEvidence];
    for(const result of evidence)for(const group of result.groups)implicated.add(group);
    // Both saved IDs must identify the recorded unit through physical aliases,
    // not merely unrelated units that happen to have been merged later.
    const contradictory=selectedEvidence.some(result=>!unitEvidence.some(unitResult=>intersects(result.ids,unitResult.ids)));
    const invalid=!unit?.length||!selected?.length||unavailableLogicalIds.has(logical)||unavailableLogicalIds.has(selection.roundTripId)||contradictory||evidence.some(result=>result.invalid||result.groups.size!==1)||implicated.size!==1;
    return {selection,group:invalid?null:[...implicated][0]!,implicated,invalid};
  });

  const owners=new Map<number,SelectionBinding[]>();
  for(const binding of bindings)if(!binding.invalid&&binding.group!==null){
    const rows=owners.get(binding.group)??[];rows.push(binding);owners.set(binding.group,rows);
  }
  for(const rows of owners.values())if(rows.length>1)for(const row of rows)row.invalid=true;
  const omitted=new Set<number>();
  for(const binding of bindings)if(binding.invalid)for(const group of binding.implicated)omitted.add(group);
  // A valid row cannot retain a group also implicated by a conflicting saved row.
  for(const binding of bindings)if(binding.group!==null&&omitted.has(binding.group))binding.invalid=true;
  const blocked=[...new Set(bindings.filter(binding=>binding.invalid).flatMap(binding=>[binding.selection.roundTripId,binding.selection.logicalTradeId]).filter(id=>typeof id==='string'))];
  return trades.flatMap((trade,group)=>{
    if(omitted.has(group))return [];
    const matched=[...new Set(bindings.filter(binding=>!binding.invalid&&binding.group===group).flatMap(binding=>[binding.selection.roundTripId,binding.selection.logicalTradeId]))];
    return [{...trade,reviewSelectionAliases:{matched,blocked}}];
  });
}
