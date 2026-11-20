// @vitest-environment jsdom
import Database from 'better-sqlite3';
import {act,createElement} from 'react';
import {createRoot} from 'react-dom/client';
import {describe,expect,it} from 'vitest';
import type {JournalAdminScope} from '../../platform/contracts/journal-admin-scope';
import {CommunityAdmissionError,CommunityAdmissionService} from './community-admission-service';
import {CommunityBrandedContentRepository} from './community-branded-content-repository';
import {CommunityAdmissionEditor,needsDestinationAllowanceDecision} from '@/app/admin/journal/communities/admission/admission-editor';
import type {CommunityAdmissionEntry} from '../contracts/community-admission';

const at='2026-11-20T03:00:00.000Z';
const owner='10000000-0000-4000-8000-000000000001';
const community='20000000-0000-4000-8000-000000000002';
const otherCommunity='30000000-0000-4000-8000-000000000003';
const guild='1559172784813514803';
const otherGuild='1433570740430573642';
const operatorGrant='40000000-0000-4000-8000-000000000004';
const wrongActor='50000000-0000-4000-8000-000000000005';

function scope():JournalAdminScope{return {userId:owner,role:'journal_owner_admin',mode:'production_discord_owner',authorizedAtUtc:at,discordOwnerVerifiedAtUtc:at,permissions:['manage_users']};}
function fixture(){
 const db=new Database(':memory:');
 db.exec(`
 CREATE TABLE traderlink_community_admission_invitations(discord_guild_id TEXT PRIMARY KEY,display_name TEXT,actor_user_id TEXT,reason TEXT,created_at_utc TEXT);
 CREATE TABLE traderlink_community_admission_policy_versions(revision INTEGER PRIMARY KEY,mode TEXT,requirements_json TEXT,actor_user_id TEXT,reason TEXT,created_at_utc TEXT);
 CREATE TABLE traderlink_community_admission_decisions(decision_id TEXT,discord_guild_id TEXT,revision INTEGER,kind TEXT,status TEXT,actor_user_id TEXT,reason TEXT,created_at_utc TEXT,admission_revision INTEGER,source TEXT,policy_revision INTEGER,evidence_receipt_id TEXT);
 CREATE TABLE traderlink_community_admission_commands(actor_user_id TEXT,request_key TEXT,command_sha256 TEXT,receipt_json TEXT,created_at_utc TEXT,PRIMARY KEY(actor_user_id,request_key));
 CREATE TABLE traderlink_community_admission_member_counts(receipt_id TEXT,discord_guild_id TEXT,revision INTEGER,source TEXT,approximate_total_members INTEGER,observed_at_utc TEXT);
 CREATE TABLE traderlink_communities(community_id TEXT PRIMARY KEY,discord_guild_id TEXT UNIQUE,owner_user_id TEXT,status TEXT);
 CREATE TABLE traderlink_community_operator_grants(user_id TEXT PRIMARY KEY,status TEXT);
 CREATE TABLE platform_operator_grants(operator_grant_id TEXT PRIMARY KEY,user_id TEXT,authority_key TEXT,operator_role TEXT,grant_state TEXT,
   granted_by_kind TEXT,granted_by_user_id TEXT,grant_receipt_sha256 TEXT,recovery_of_grant_id TEXT,granted_at_utc TEXT,revoked_at_utc TEXT,updated_at_utc TEXT);
 CREATE TABLE traderlink_community_page_allowances(community_id TEXT PRIMARY KEY,page_limit INTEGER,updated_by_user_id TEXT,updated_at_utc TEXT);
 CREATE TABLE traderlink_community_content_pages(page_id TEXT PRIMARY KEY,community_id TEXT,status TEXT,updated_at_utc TEXT);
 CREATE TABLE traderlink_community_content_audit(audit_id TEXT PRIMARY KEY,community_id TEXT,actor_user_id TEXT,event_type TEXT,object_type TEXT,object_id TEXT,details_json TEXT,occurred_at_utc TEXT);
 `);
 const insertInvite=db.prepare('INSERT INTO traderlink_community_admission_invitations VALUES(?,?,?,?,?)');
 insertInvite.run(guild,'Tests',owner,'QA',at);insertInvite.run(otherGuild,'Main',owner,'QA',at);
 const insertDecision=db.prepare("INSERT INTO traderlink_community_admission_decisions VALUES(?,?,1,'admission','approved',?,'QA',?,NULL,'owner',NULL,NULL)");
 insertDecision.run(crypto.randomUUID(),guild,owner,at);insertDecision.run(crypto.randomUUID(),otherGuild,owner,at);
 db.prepare("INSERT INTO traderlink_communities VALUES(?,?,?,'active')").run(community,guild,owner);
 db.prepare("INSERT INTO traderlink_communities VALUES(?,?,?,'active')").run(otherCommunity,otherGuild,owner);
 db.prepare("INSERT INTO traderlink_community_operator_grants VALUES(?,'active')").run(owner);
 db.prepare("INSERT INTO platform_operator_grants VALUES(?,?,'journal_administration','journal_owner_admin','active','bootstrap_console',NULL,?,NULL,?,NULL,?)")
   .run(operatorGrant,owner,'a'.repeat(64),at,at);
 return db;
}
function command(pageLimit:number,expectedMutationToken:string|null){return {action:'destination_allowance' as const,guildId:guild,pageLimit,expectedMutationToken,reason:'Private beta allowance review'};}

describe('Community destination allowance administration',()=>{
 it.each([
  ['connected approved unconfigured','connected','approved','unconfigured',true],
  ['configured zero','connected','approved','configured',false],
  ['not connected','not_connected','approved','unconfigured',false],
  ['not approved','connected','pending','unconfigured',false],
 ] as const)('derives the operator queue for %s',(_label,connectionState,admissionStatus,allowanceState,expected)=>{const entry={admission:{status:admissionStatus},destinationAllowance:{connectionState,state:allowanceState}} as unknown as CommunityAdmissionEntry;expect(needsDestinationAllowanceDecision(entry)).toBe(expected);});
 it('keeps queue filters disabled while an admission form has unsaved changes',async()=>{const db=fixture(),container=document.createElement('div'),root=createRoot(container);document.body.append(container);(globalThis as {IS_REACT_ACT_ENVIRONMENT?:boolean}).IS_REACT_ACT_ENVIRONMENT=true;try{const initial=new CommunityAdmissionService(db,scope(),at).read();await act(async()=>root.render(createElement(CommunityAdmissionEditor,{initial})));const allowanceForm=[...container.querySelectorAll('form')].find(form=>form.textContent?.includes('Publishing destination allowance'));const reason=allowanceForm?.querySelector('textarea[name="reason"]') as HTMLTextAreaElement|null;expect(reason).not.toBeNull();await act(async()=>{Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value')?.set?.call(reason,'Unsaved operator reason');reason!.dispatchEvent(new Event('input',{bubbles:true}));});expect(container.textContent).toContain('You have unsaved form changes.');const filters=[...container.querySelectorAll('button')].filter(button=>button.textContent==='All communities'||button.textContent==='Needs allowance decision') as HTMLButtonElement[];expect(filters).toHaveLength(2);expect(filters.every(button=>button.disabled)).toBe(true);}finally{await act(async()=>root.unmount());container.remove();db.close();}});
 it('distinguishes unconfigured and configured zero, with a monotonic frozen-clock token',()=>{
  const db=fixture();try{
   const service=new CommunityAdmissionService(db,scope(),at);
   expect(service.read().entries.find(entry=>entry.guildId===guild)?.destinationAllowance).toMatchObject({connectionState:'connected',state:'unconfigured',pageLimit:null,pagesUsed:0,canManage:true});
   const first=service.execute(command(0,null),crypto.randomUUID());
   expect(first).toMatchObject({action:'destination_allowance',guildId:guild,mutationToken:at});
   expect(service.read().entries.find(entry=>entry.guildId===guild)?.destinationAllowance).toMatchObject({state:'configured',pageLimit:0,mutationToken:at});
   const second=service.execute(command(3,first.mutationToken!),crypto.randomUUID());
   expect(second.mutationToken).toBe('2026-11-20T03:00:00.001Z');
   expect(db.prepare("SELECT count(*) count FROM traderlink_community_content_audit WHERE event_type LIKE 'allowance.%'").get()).toEqual({count:2});
  }finally{db.close();}
 });
 it('reauthorizes exact replay and separates it from a new stale-token request',()=>{
  const db=fixture();try{
   const service=new CommunityAdmissionService(db,scope(),at),key=crypto.randomUUID();
   const first=service.execute(command(2,null),key);
   expect(service.execute(command(2,null),key)).toEqual(first);
   expect(db.prepare('SELECT count(*) count FROM traderlink_community_content_audit').get()).toEqual({count:1});
   expect(()=>service.execute(command(4,null),crypto.randomUUID())).toThrow(expect.objectContaining({status:409}));
   db.prepare("UPDATE platform_operator_grants SET grant_state='revoked',revoked_at_utc=?,updated_at_utc=? WHERE operator_grant_id=?").run(at,at,operatorGrant);
   expect(()=>service.execute(command(2,null),key)).toThrow(expect.objectContaining({status:403}));
   expect(db.prepare('SELECT page_limit FROM traderlink_community_page_allowances WHERE community_id=?').get(community)).toEqual({page_limit:2});
   expect(db.prepare('SELECT count(*) count FROM traderlink_community_content_audit').get()).toEqual({count:1});
  }finally{db.close();}
 });
 it('resolves the target from the guild and never crosses communities',()=>{
  const db=fixture();try{
   const result=new CommunityAdmissionService(db,scope(),at).execute(command(5,null),crypto.randomUUID());
   expect(result.guildId).toBe(guild);
   expect(db.prepare('SELECT page_limit FROM traderlink_community_page_allowances WHERE community_id=?').get(community)).toEqual({page_limit:5});
   expect(db.prepare('SELECT page_limit FROM traderlink_community_page_allowances WHERE community_id=?').get(otherCommunity)).toBeUndefined();
  }finally{db.close();}
 });
 it('accepts multiline private reasons and preserves them in the SQLite audit',()=>{
  const db=fixture();try{
   const reason='First line\r\n\tSecond line';
   const service=new CommunityAdmissionService(db,scope(),at);
   expect(service.execute({...command(2,null),reason},crypto.randomUUID())).toMatchObject({action:'destination_allowance',guildId:guild,mutationToken:at});
   const row=db.prepare("SELECT details_json FROM traderlink_community_content_audit WHERE event_type='allowance.configured'").get() as {details_json:string};
   expect(JSON.parse(row.details_json)).toMatchObject({before:null,after:2,reason});
  }finally{db.close();}
 });
 it.each([['unsafe control','Private\u0000reason'],['over length','x'.repeat(2001)]])('rejects %s private reasons without writing allowance or audit',(_label,reason)=>{
  const db=fixture();try{
   const service=new CommunityAdmissionService(db,scope(),at);
   expect(()=>service.execute({...command(2,null),reason},crypto.randomUUID())).toThrow(CommunityAdmissionError);
   expect(db.prepare('SELECT count(*) count FROM traderlink_community_page_allowances').get()).toEqual({count:0});
   expect(db.prepare('SELECT count(*) count FROM traderlink_community_content_audit').get()).toEqual({count:0});
  }finally{db.close();}
 });
 it('requires approved admission, a connected target and an active operator',()=>{
  const db=fixture();try{
   db.prepare("UPDATE traderlink_community_admission_decisions SET status='pending' WHERE discord_guild_id=?").run(guild);
   expect(()=>new CommunityAdmissionService(db,scope(),at).execute(command(1,null),crypto.randomUUID())).toThrow(expect.objectContaining({status:400}));
   db.prepare("UPDATE traderlink_community_admission_decisions SET status='approved' WHERE discord_guild_id=?").run(guild);
   db.prepare('DELETE FROM traderlink_communities WHERE community_id=?').run(community);
   expect(()=>new CommunityAdmissionService(db,scope(),at).execute(command(1,null),crypto.randomUUID())).toThrow(expect.objectContaining({status:400}));
  }finally{db.close();}
 });
 it('uses only the canonical exact-actor grant and propagates singleton conflicts',()=>{
  const db=fixture();try{
   db.prepare("UPDATE platform_operator_grants SET grant_state='revoked',revoked_at_utc=?,updated_at_utc=? WHERE operator_grant_id=?").run(at,at,operatorGrant);
   expect(new CommunityAdmissionService(db,scope(),at).read().entries.find(entry=>entry.guildId===guild)?.destinationAllowance.canManage).toBe(false);
   expect(()=>new CommunityAdmissionService(db,scope(),at).execute(command(5,null),crypto.randomUUID())).toThrow(expect.objectContaining({status:403}));
   db.prepare("INSERT INTO platform_operator_grants VALUES(?,?,'journal_administration','journal_owner_admin','active','bootstrap_console',NULL,?,NULL,?,NULL,?)")
     .run('60000000-0000-4000-8000-000000000006',wrongActor,'b'.repeat(64),at,at);
   expect(new CommunityAdmissionService(db,scope(),at).read().entries.find(entry=>entry.guildId===guild)?.destinationAllowance.canManage).toBe(false);
   expect(()=>new CommunityAdmissionService(db,scope(),at).execute(command(5,null),crypto.randomUUID())).toThrow(expect.objectContaining({status:403}));
   db.prepare("UPDATE platform_operator_grants SET user_id=?,authority_key='other_authority' WHERE operator_grant_id=?").run(owner,'60000000-0000-4000-8000-000000000006');
   expect(new CommunityAdmissionService(db,scope(),at).read().entries.find(entry=>entry.guildId===guild)?.destinationAllowance.canManage).toBe(false);
   expect(()=>new CommunityAdmissionService(db,scope(),at).execute(command(5,null),crypto.randomUUID())).toThrow(expect.objectContaining({status:403}));
   db.prepare("UPDATE platform_operator_grants SET authority_key='journal_administration' WHERE operator_grant_id=?").run('60000000-0000-4000-8000-000000000006');
   db.prepare("INSERT INTO platform_operator_grants VALUES(?,?,'journal_administration','journal_owner_admin','active','bootstrap_console',NULL,?,NULL,?,NULL,?)")
     .run('70000000-0000-4000-8000-000000000007',owner,'c'.repeat(64),at,at);
   expect(()=>new CommunityAdmissionService(db,scope(),at).read()).toThrow(expect.objectContaining({code:'TRADERLINK_JOURNAL_ADMIN_AUTHORITY_CONFLICT'}));
   expect(()=>new CommunityAdmissionService(db,scope(),at).execute(command(5,null),crypto.randomUUID())).toThrow(expect.objectContaining({code:'TRADERLINK_JOURNAL_ADMIN_AUTHORITY_CONFLICT'}));
  }finally{db.close();}
 });
 it('requires fresh production Journal Admin and Discord-owner evidence independently of the canonical grant',()=>{
  const db=fixture();try{
   const stale={...scope(),authorizedAtUtc:'2026-11-20T02:54:59.999Z'};
   const future={...scope(),discordOwnerVerifiedAtUtc:'2026-11-20T03:00:00.001Z'};
   expect(()=>new CommunityAdmissionService(db,stale,at)).toThrow(expect.objectContaining({status:403}));
   expect(()=>new CommunityAdmissionService(db,future,at)).toThrow(expect.objectContaining({status:403}));
   expect(db.prepare('SELECT count(*) count FROM traderlink_community_page_allowances').get()).toEqual({count:0});
  }finally{db.close();}
 });
 it('does not let a legacy-only grant authorize allowance writes',()=>{
  const db=fixture();try{
   db.prepare('DELETE FROM platform_operator_grants').run();
   expect(db.prepare("SELECT status FROM traderlink_community_operator_grants WHERE user_id=?").get(owner)).toEqual({status:'active'});
   expect(()=>new CommunityBrandedContentRepository(db).setPageAllowance({communityId:community,pageLimit:5,platformActorUserId:owner,expectedMutationToken:null,reason:'Legacy is not authority',atUtc:at})).toThrow(expect.objectContaining({code:'TRADERLINK_WORKSPACE_ACCESS_DENIED'}));
   expect(db.prepare('SELECT count(*) count FROM traderlink_community_page_allowances').get()).toEqual({count:0});
   expect(db.prepare('SELECT count(*) count FROM traderlink_community_content_audit').get()).toEqual({count:0});
  }finally{db.close();}
 });
 it('rechecks canonical authority inside the writer before CAS, audit or command mutation',()=>{
  const db=fixture();try{
   const originalTransaction=db.transaction.bind(db),repository=new CommunityBrandedContentRepository(db);
   let writerEntered=false;
   Object.defineProperty(db,'transaction',{configurable:true,value:(operation:()=>unknown)=>originalTransaction(()=>{
    writerEntered=true;
    expect(db.inTransaction).toBe(true);
    db.prepare("UPDATE platform_operator_grants SET grant_state='revoked',revoked_at_utc=?,updated_at_utc=? WHERE operator_grant_id=?").run(at,at,operatorGrant);
    return operation();
   })});
   expect(()=>repository.setPageAllowance({communityId:community,pageLimit:5,platformActorUserId:owner,expectedMutationToken:null,reason:'Revoke at writer entry',atUtc:at})).toThrow(expect.objectContaining({code:'TRADERLINK_WORKSPACE_ACCESS_DENIED'}));
   expect(writerEntered).toBe(true);
   expect(db.inTransaction).toBe(false);
   expect(db.prepare("SELECT grant_state FROM platform_operator_grants WHERE operator_grant_id=?").get(operatorGrant)).toEqual({grant_state:'active'});
   expect(db.prepare('SELECT count(*) count FROM traderlink_community_page_allowances').get()).toEqual({count:0});
   expect(db.prepare('SELECT count(*) count FROM traderlink_community_content_audit').get()).toEqual({count:0});
   expect(db.prepare('SELECT count(*) count FROM traderlink_community_admission_commands').get()).toEqual({count:0});
  }finally{db.close();}
 });
 it('enforces capacity for every archived to nonarchived transition',()=>{
  const db=fixture();try{
   const repository=new CommunityBrandedContentRepository(db);
   repository.setPageAllowance({communityId:community,pageLimit:0,platformActorUserId:owner,expectedMutationToken:null,reason:'Zero during beta',atUtc:at});
   const page='40000000-0000-4000-8000-000000000004';
   db.prepare("INSERT INTO traderlink_community_content_pages VALUES(?,?, 'archived',?)").run(page,community,at);
   for(const status of ['draft','active'] as const)expect(()=>repository.setPageStatus({communityId:community,pageId:page,actorUserId:owner,status,atUtc:at})).toThrow();
   expect(db.prepare('SELECT status FROM traderlink_community_content_pages WHERE page_id=?').get(page)).toEqual({status:'archived'});
  }finally{db.close();}
 });
 it.each([-1,1001,1.5])('rejects an invalid limit %s',pageLimit=>{
  const db=fixture();try{expect(()=>new CommunityAdmissionService(db,scope(),at).execute(command(pageLimit,null),crypto.randomUUID())).toThrow(CommunityAdmissionError);}finally{db.close();}
 });
});
