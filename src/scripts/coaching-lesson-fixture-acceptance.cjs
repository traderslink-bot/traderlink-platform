// Reusable only for approved, newly named synthetic fixtures. All writes use product workflows.
const assert=require('node:assert/strict');
const PREFIX='QA ONLY — Lesson publication validation';
async function runLessonFixtureAcceptance({database,platform,programs,actions,communityId,coach,student,coachProfileId,audienceId,requiredRoleId,atUtc}) {
 const base={communityId,actor:coach,atUtc};
 const existing=database.prepare('SELECT plan_id FROM traderlink_community_coaching_plans WHERE community_id=? AND name LIKE ?').all(communityId,PREFIX+'%');
 assert.equal(existing.length,0,'Inspect existing fixture before retrying; never create duplicates');
 const planInput={...base,coachProfileId,name:'',description:PREFIX+' — synthetic only; no Journal sharing, payments or Discord delivery.',cadence:'custom',studentCapacity:1,messagingIncluded:false,tradeReviewsIncluded:false,sessionsIncluded:false,teachingIncluded:true,priceLabel:'$0 QA ONLY',priceAmountMinor:0,currency:'USD',billingCadence:'one_time',quoteRequired:false,paymentInstructions:'',audienceId,requiredDiscordRoleId:requiredRoleId,planStyle:'custom',items:[{itemType:'group_lesson',frequency:'once',coveragePeriod:'single_item',quantity:1,dueOffsetDays:0,selectionMode:'not_applicable',followUpDays:0,measurementKind:'lessons',plannedMinutes:null,timelineEnabled:false,reviewDepth:'standard'}],journalScopes:[],publish:false};
 const planA=platform.createPlan({...planInput,name:PREFIX+' — A'});
 const planB=platform.createPlan({...planInput,name:PREFIX+' — B mismatch'});
 platform.updatePlanStatus({...base,planId:planA,status:'active'});
 platform.updatePlanStatus({...base,planId:planB,status:'active'});
 const relationshipId=platform.requestCoaching({...base,actor:student,planId:planA});
 platform.setRelationshipStatus({...base,relationshipId,status:'active'});
 const selected=programs.createTeaching({...base,title:PREFIX+' — selected draft',teachingType:'lesson',body:'QA ONLY saved content — keep this exact text after rejected publication.',deliveryUrl:'',audienceMode:'selected_students',relationshipIds:[relationshipId],publish:false});
 const snapshot=id=>({lesson:database.prepare('SELECT * FROM traderlink_community_coaching_teaching_items WHERE teaching_id=?').get(id),recipients:database.prepare('SELECT * FROM traderlink_community_coaching_teaching_students WHERE teaching_id=? ORDER BY relationship_id').all(id)});
 const initial=snapshot(selected);assert.equal(initial.recipients.length,1);assert.equal(initial.recipients[0].relationship_id,relationshipId);
 const form=(id,status='published')=>{const row=snapshot(id).lesson;const data=new FormData();for(const[key,value]of Object.entries({communitySlug:actions.slug,teachingId:id,title:row.title,body:row.body,deliveryKind:row.delivery_kind,deliveryUrl:row.delivery_url,recordingUrl:row.recording_url,status}))data.set(key,value??'');return data;};
 const evidence=[];
 async function reject(id,reason){const before=snapshot(id);await assert.rejects(actions.save(form(id)),/Choose students before publishing this lesson\./);assert.deepEqual(snapshot(id),before,'Rejected action preserves exact draft and recipients');evidence.push({reason,action:'saveCoachingTeachingDetailsAction',result:'rejected',message:'Choose students before publishing this lesson.',state:snapshot(id)});}
 async function archive(intent){const data=new FormData();for(const[key,value]of Object.entries({communitySlug:actions.slug,relationshipId,intent}))data.set(key,value);await actions.archive(data);}
 await archive('archive');await reject(selected,'archived sole recipient');
 await archive('restore');
 platform.setRelationshipStatus({...base,relationshipId,status:'ended'});await reject(selected,'ended sole recipient');
 platform.setRelationshipStatus({...base,relationshipId,status:'active'});
 await actions.save(form(selected));assert.equal(snapshot(selected).lesson.status,'published');evidence.push({reason:'supported archive restore and relationship reactivation',result:'published',state:snapshot(selected)});
 await actions.save(form(selected,'draft'));
 const mismatch=programs.createTeaching({...base,title:PREFIX+' — plan mismatch draft',teachingType:'lesson',body:'QA ONLY plan-B draft; plan-A student is not an eligible recipient.',deliveryUrl:'',audienceMode:'plan',planId:planB,relationshipIds:[relationshipId],publish:false});
 assert.equal(snapshot(mismatch).recipients.length,0,'Supported creation does not assign a plan-A student to plan B');
 await reject(mismatch,'plan B has no eligible student; supplied student belongs only to plan A');
 // Existing lesson audience/relationship plan cannot be edited by supported workflow.
 // Reuse creates the corrected lesson; retain the rejected original as evidence.
 const restored=programs.createTeaching({...base,sourceTeachingId:mismatch,title:PREFIX+' — corrected plan A',teachingType:'lesson',body:snapshot(mismatch).lesson.body,deliveryUrl:'',audienceMode:'plan',planId:planA,relationshipIds:[relationshipId],publish:false});
 await actions.save(form(restored));assert.equal(snapshot(restored).lesson.status,'published');assert.equal(snapshot(restored).recipients.length,1);assert.equal(snapshot(restored).recipients[0].relationship_id,relationshipId);
 evidence.push({reason:'supported reuse with corrected plan audience',result:'published',state:snapshot(restored)});
 // Leave an actual negative fixture ready for PC retest; do not delete records.
 await archive('archive');
 return {prefix:PREFIX,ids:{planA,planB,relationshipId,selected,mismatch,restored},initial,evidence,final:{relationship:database.prepare('SELECT relationship_id,plan_id,status,archived_at_utc FROM traderlink_community_coaching_relationships WHERE relationship_id=?').get(relationshipId),selected:snapshot(selected),mismatch:snapshot(mismatch),restored:snapshot(restored)},agreementRequired:false,journalGrantsCreated:0,explanation:'Mismatch draft deliberately has no recipients: supported service correctly refuses assigning the wrong-plan relationship. Corrected reuse preserves the original mismatch evidence. No stale wrong-plan assignment was fabricated on staging.'};
}
module.exports={PREFIX,runLessonFixtureAcceptance};
