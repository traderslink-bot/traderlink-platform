// @vitest-environment node
import Database from 'better-sqlite3';
import {afterEach,describe,expect,it,vi} from 'vitest';
import {readIndependentAssignedLesson,updateIndependentAssignedLesson} from './independent-coaching-lesson-management';
import {IndependentCoachingRepository} from './independent-coaching-repository';

vi.mock('./coaching-commercial-access',()=>({requireCoachCommercialAccess:vi.fn()}));
const databases:Database.Database[]=[];
afterEach(()=>{databases.splice(0).forEach(db=>db.close());vi.clearAllMocks();});
const planId='00000000-0000-4000-8000-000000000001',enrollmentId='00000000-0000-4000-8000-000000000002',workId='00000000-0000-4000-8000-000000000003';
const atUtc='2026-11-19T12:00:00.000Z';

function fixture(){
 const db=new Database(':memory:');databases.push(db);
 db.exec(`
  CREATE TABLE platform_users(user_id TEXT PRIMARY KEY,display_name TEXT);
  CREATE TABLE traderlink_coaching_contexts(context_id TEXT PRIMARY KEY,coach_user_id TEXT);
  CREATE TABLE traderlink_coaching_enrollments(enrollment_id TEXT PRIMARY KEY,context_id TEXT,plan_id TEXT,student_user_id TEXT,status TEXT);
  CREATE TABLE traderlink_coaching_accepted_terms(agreement_id TEXT PRIMARY KEY,enrollment_id TEXT,status TEXT,accepted_at_utc TEXT,terms_json TEXT);
  CREATE TABLE traderlink_coaching_work(work_id TEXT PRIMARY KEY,enrollment_id TEXT,agreement_id TEXT,kind TEXT,status TEXT,data_json TEXT,due_at_utc TEXT,updated_at_utc TEXT,created_at_utc TEXT);
  CREATE TABLE traderlink_coaching_questions(question_id TEXT,work_id TEXT,body TEXT,created_at_utc TEXT);
  CREATE TABLE traderlink_coaching_question_answers(question_id TEXT,revision INTEGER,body TEXT);
  INSERT INTO platform_users VALUES('student','Test student');
  INSERT INTO traderlink_coaching_contexts VALUES('context','coach');
 `);
 db.prepare("INSERT INTO traderlink_coaching_enrollments VALUES(?,'context',?,'student','active')").run(enrollmentId,planId);
 db.prepare("INSERT INTO traderlink_coaching_accepted_terms VALUES('accepted',?,'accepted',?,?)").run(enrollmentId,atUtc,JSON.stringify({planName:'Accepted plan',items:[{planItemId:'included-lesson',itemType:'group_lesson'}]}));
 db.prepare("INSERT INTO traderlink_coaching_work VALUES(?,?,'accepted','lesson','open',?,NULL,?,?)").run(workId,enrollmentId,JSON.stringify({planItemId:'included-lesson',serviceType:'group_lesson',quantity:1,assignedTo:'student'}),atUtc,atUtc);
 return {db,input:{actorUserId:'coach',planId,enrollmentId,workId,atUtc}};
}

describe('accepted independent lesson assignment',()=>{
 it('reads the exact coach, plan, enrollment and accepted included lesson',()=>{
  const {db,input}=fixture();
  expect(readIndependentAssignedLesson(db,input)).toMatchObject({studentId:'student',planId,enrollmentId,agreementId:'accepted',acceptedService:true,canManage:true,work:{workId,kind:'lesson',status:'open'}});
 });
 it.each(['student','another-coach'])('denies assignment reads and writes by %s',actorUserId=>{
  const {db,input}=fixture(),other={...input,actorUserId};
  expect(()=>readIndependentAssignedLesson(db,other)).toThrow('unavailable');
  expect(()=>updateIndependentAssignedLesson(db,{...other,data:{title:'Unwanted edit'},status:'open',dueAtUtc:null})).toThrow('unavailable');
  expect(JSON.parse((db.prepare('SELECT data_json FROM traderlink_coaching_work').get() as {data_json:string}).data_json).title).toBeUndefined();
 });
 it.each(['planId','enrollmentId','workId'] as const)('does not substitute a different %s',key=>{
  const {db,input}=fixture();
  expect(()=>readIndependentAssignedLesson(db,{...input,[key]:'00000000-0000-4000-8000-000000000099'})).toThrow('unavailable');
 });
 it('does not manage a lesson absent from the accepted service',()=>{
  const {db,input}=fixture();db.prepare("UPDATE traderlink_coaching_accepted_terms SET terms_json=?").run(JSON.stringify({planName:'Accepted plan',items:[]}));
  expect(readIndependentAssignedLesson(db,input).canManage).toBe(false);
  expect(()=>updateIndependentAssignedLesson(db,{...input,data:{url:'https://example.test/lesson'},status:'assigned',dueAtUtc:null})).toThrow('active, accepted');
 });
 it('keeps ended assignments readable and rejects changes without losing saved details',()=>{
  const {db,input}=fixture();db.prepare("UPDATE traderlink_coaching_enrollments SET status='ended'").run();
  expect(readIndependentAssignedLesson(db,input)).toMatchObject({enrollmentStatus:'ended',acceptedService:true,canManage:false});
  expect(()=>updateIndependentAssignedLesson(db,{...input,data:{title:'Changed'},status:'assigned',dueAtUtc:null})).toThrow('active, accepted');
  expect(readIndependentAssignedLesson(db,input).work.status).toBe('open');
 });
 it('requires a usable lesson link before assignment and preserves accepted unit metadata',()=>{
  const {db,input}=fixture();
  expect(()=>updateIndependentAssignedLesson(db,{...input,data:{title:'Risk lesson'},status:'assigned',dueAtUtc:null})).toThrow('lesson link');
  expect(()=>updateIndependentAssignedLesson(db,{...input,data:{url:'http://example.test/lesson'},status:'assigned',dueAtUtc:null})).toThrow('HTTPS');
  updateIndependentAssignedLesson(db,{...input,data:{title:'Risk lesson',description:'Review the risk checklist.',url:'https://example.test/lesson'},status:'assigned',dueAtUtc:'2026-11-23T22:00:00.000Z'});
  expect(readIndependentAssignedLesson(db,input).work).toMatchObject({status:'assigned',dueAtUtc:'2026-11-23T22:00:00.000Z',data:{planItemId:'included-lesson',serviceType:'group_lesson',quantity:1,assignedTo:'student',title:'Risk lesson'}});
 });
 it.each(['open','scheduled','cancelled'])('keeps %s lesson content out of student reads without deleting the coach draft',status=>{
  const {db,input}=fixture(),repo=new IndependentCoachingRepository(db);
  updateIndependentAssignedLesson(db,{...input,data:{title:'Private draft title',description:'Private lesson draft.',url:'https://example.test/private-lesson'},status,dueAtUtc:null});
  const student=repo.listWork(enrollmentId,'student')[0],coach=repo.listWork(enrollmentId,'coach')[0];
  expect(student.data).toMatchObject({planItemId:'included-lesson',quantity:1,serviceType:'group_lesson'});
  for(const field of ['title','description','url'])expect(student.data).not.toHaveProperty(field);
  expect(coach.data).toMatchObject({title:'Private draft title',description:'Private lesson draft.',url:'https://example.test/private-lesson'});
 });
 it('shares an assigned lesson and retains completed lesson history after enrollment ends',()=>{
  const {db,input}=fixture(),repo=new IndependentCoachingRepository(db),dueAtUtc='2026-11-23T22:00:00.000Z';
  updateIndependentAssignedLesson(db,{...input,data:{title:'Assigned lesson',description:'Student lesson.',url:'https://example.test/lesson'},status:'assigned',dueAtUtc});
  expect(repo.listWork(enrollmentId,'student')[0].data).toMatchObject({title:'Assigned lesson',url:'https://example.test/lesson'});
  repo.updateWork({workId,actorUserId:'student',data:{},status:'completed',dueAtUtc:null,atUtc});
  db.prepare("UPDATE traderlink_coaching_enrollments SET status='ended'").run();
  expect(repo.listWork(enrollmentId,'student')[0]).toMatchObject({status:'completed',dueAtUtc,data:{title:'Assigned lesson',description:'Student lesson.',url:'https://example.test/lesson'}});
 });
});
