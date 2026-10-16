// Creates a NEW disposable signed-member fixture. Never reads an existing DB.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto');
const name=process.argv[2];if(!name||!/^[a-z0-9-]+$/.test(name))throw Error('New profile name required');
cp.execFileSync(process.execPath,[path.join(__dirname,'register-generation.cjs'),name],{stdio:'inherit'});
const profile=JSON.parse(fs.readFileSync(`/workspaces/traderslink-coordinator/codex-setup/preview-profiles/${name}.json`,'utf8'));
const fixture=JSON.parse(fs.readFileSync(profile.fixture,'utf8')),sessions=JSON.parse(fs.readFileSync(path.join(fixture.dir,'generation-sessions.json'),'utf8'));
Object.assign(process.env,fixture.env,{STRIPE_SECRET_KEY:'sk_test_synthetic_only',STRIPE_MEMBERSHIP_WEBHOOK_SECRET:'synthetic_only'});
const Module=require('node:module'),load=Module._load;Module._load=function(id,...args){return id==='server-only'?{}:load.call(this,id,...args)};require('tsx/cjs');
const {openPlatformDatabase}=require('../../src/modules/platform/server/database/open-platform-database.ts');
const {emptyMembershipPlan,newMembershipPlanPrice}=require('../../src/modules/platform/contracts/membership-plan-editor.ts');
const {newMembershipProductFeature}=require('../../src/modules/platform/contracts/membership-product-features.ts');
const {writeMembershipPlanEditor}=require('../../src/modules/platform/server/membership/membership-plan-editor-write.ts');
const {PlatformMembershipRepository}=require('../../src/modules/platform/server/membership/platform-membership-repository.ts');
const db=openPlatformDatabase({mode:'runtime'}),at=new Date().toISOString(),actor=sessions.excluded.userId;
db.prepare("INSERT INTO platform_membership_provider_definitions VALUES ('stripe','Synthetic Stripe','native','ready',?,?,?) ON CONFLICT(provider_key) DO UPDATE SET configuration_state='ready'").run(actor,at,at);
function publish(type,name,amount,limit){const doc=emptyMembershipPlan();Object.assign(doc,{name,visibility:'public',packageType:type});doc.features=[...(type==='plan'?doc.features:[]),{...newMembershipProductFeature('trade_analyzer.analyses',limit),resetDays:30}];const price=newMembershipPlanPrice(crypto.randomUUID());Object.assign(price,{name,billing:'recurring',provider:'stripe',initialPrice:amount,renewalPrice:amount});doc.prices=[price];return writeMembershipPlanEditor(db,actor,{requestId:crypto.randomUUID(),draftId:null,revision:null,document:doc,intent:'publish',applyToMembers:false},at)}
const base=publish('plan','Synthetic monthly plan','20',10),addon=publish('addon','Synthetic extra analyses','10',20);
const start=new Date(Date.now()-86400000).toISOString(),end=new Date(Date.now()+30*86400000).toISOString(),subscriptions=[];
for(const role of ['excluded','zero']){const user=sessions[role].userId,id='sub_qa_'+role,customer='cus_qa_'+role;
 new PlatformMembershipRepository(db).grantEntitlement({actorUserId:actor,userId:user,planVersionId:base.versionId,sourceType:'subscription',sourceRef:id,startsAtUtc:start,endsAtUtc:end,atUtc:at});
 db.prepare("INSERT INTO platform_membership_provider_subscriptions VALUES (?,?,?,'stripe',?,?,'active',?,?,0,?,?,?)").run(crypto.randomUUID(),user,base.offerIds[0],customer,id,start,end,at,at,at);
 subscriptions.push({id,customer,status:'active',livemode:false,collection_method:'charge_automatically',current_period_end:Math.floor(Date.parse(end)/1000),cancel_at_period_end:false,items:{data:[{id:'si_qa_'+role,quantity:1,price:{id:'price_qa_old_'+role,currency:'usd',unit_amount:2000,recurring:{interval:'month',interval_count:1}}}]},latest_invoice:{id:'in_qa_old_'+role,status:'paid'},metadata:{}});
}
db.close();fixture.addonStripe={subscriptions,addonOfferId:addon.offerIds[0]};fs.writeFileSync(profile.fixture,JSON.stringify(fixture),{mode:0o600});
console.log('Added synthetic monthly subscribers and add-on; all provider requests mocked');
