import {notFound} from 'next/navigation';
import {DashboardPage} from '@/app/dashboard-template';
import {IndependentCoachingNavigation} from '@/app/(member)/coaching/navigation';
import {IndependentLessonAssignment} from '@/app/(member)/coaching/lesson-assignment';
import {independentCoachingReturnHref} from '@/src/modules/communities/contracts/independent-coaching-navigation';
import {requireCoachingPilotPageIdentity} from '@/src/modules/communities/server/coaching-pilot-request-identity';
import {readIndependentAssignedLesson} from '@/src/modules/communities/server/independent-coaching-lesson-management';
import {withReadonlyPlatformDatabase} from '@/src/modules/platform/server/database/open-readonly-platform-database';

export const dynamic='force-dynamic';
export const metadata={title:'Lesson assignment | TraderLink',robots:{index:false,follow:false}};

export default async function LessonAssignmentPage({params,searchParams}:{params:Promise<{planId:string;workId:string}>;searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const identity=await requireCoachingPilotPageIdentity(),{planId,workId}=await params,query=await searchParams;
 if(typeof query.enrollmentId!=='string')notFound();
 const enrollmentId=query.enrollmentId;
 const assignment=withReadonlyPlatformDatabase({},db=>{
  try{return readIndependentAssignedLesson(db,{actorUserId:identity.scope.userId,planId,enrollmentId,workId,atUtc:new Date().toISOString()});}
  catch{return null;}
 });
 if(!assignment)notFound();
 const fallback=`/coaching/plans/${planId}#${new URLSearchParams({student:assignment.studentId,section:'lessons'})}`;
 const returnHref=independentCoachingReturnHref(query.returnTo??fallback);
 return <DashboardPage>
  <IndependentCoachingNavigation viewerId={identity.scope.userId} coach platformCoach communities={[]}/>
  <IndependentLessonAssignment key={`${assignment.enrollmentId}:${assignment.work.workId}`} assignment={assignment} returnHref={returnHref}/>
 </DashboardPage>;
}
