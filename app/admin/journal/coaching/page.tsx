import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import {withJournalAdminPageDatabase} from '@/src/modules/platform/server/administration/require-journal-admin-page';
import {readCoachingCommercialPolicy,readCommunityCoachingCommercialContext,readCoachCommissionRate} from '@/src/modules/communities/server/coaching-commercial-policy';
import {JournalAdminPage,JournalAdminPageHeader,JournalAdminPanel} from '../journal-admin-ui';
import {CoachRateEditor} from './coach-rate-editor';
import {CoachingCommercialPolicyEditor} from './policy-editor';
export const dynamic='force-dynamic';
export default async function CoachingCommercialSettings({searchParams}:{searchParams:Promise<{communityId?:string;coachUserId?:string}>}){
 const query=await searchParams;
 const snapshot=await withJournalAdminPageDatabase(db=>{
  const communities=db.prepare('SELECT community_id id,display_name name FROM traderlink_communities ORDER BY display_name').all() as {id:string;name:string}[];
  const communityId=query.communityId??communities[0]?.id;
  if(communityId&&!communities.some(c=>c.id===communityId))throw new Error('Community unavailable.');
  const revision=(scope:string,key:string)=>(db.prepare('SELECT coalesce(max(revision),0) revision FROM traderlink_coaching_commercial_policies WHERE scope=? AND scope_key=?').get(scope,key) as {revision:number}).revision;
  const coaches=db.prepare("SELECT user_id id,display_name name FROM platform_users WHERE status='active' ORDER BY display_name,user_id").all() as {id:string;name:string}[];
  const coachUserId=query.coachUserId??coaches[0]?.id;if(coachUserId&&!coaches.some(coach=>coach.id===coachUserId))throw new Error('Choose an existing coach account.');
  return {coaches,coachUserId,coachRate:coachUserId?readCoachCommissionRate(db,coachUserId):null,communities,communityId,communityExemption:communityId?readCommunityCoachingCommercialContext(db,communityId).exemption:null,platform:readCoachingCommercialPolicy(db,{scope:'platform'}),platformRevision:revision('platform','platform'),community:communityId?readCoachingCommercialPolicy(db,{scope:'community',communityId}):null,communityRevision:communityId?revision('community',communityId):0};
 });
 return <JournalAdminPage><JournalAdminPageHeader title="Coaching commercial settings"/><JournalAdminPanel title="Platform-wide coaching"><CoachingCommercialPolicyEditor initial={snapshot.platform} revision={snapshot.platformRevision}/></JournalAdminPanel>
  <JournalAdminPanel title="Negotiated coach commission"><Stack spacing={3}><form method="get"><Stack direction={{xs:'column',sm:'row'}} spacing={2}><TextField select name="coachUserId" label="Coach account" defaultValue={snapshot.coachUserId??''} sx={{minWidth:260}}>{snapshot.coaches.map(coach=><MenuItem key={coach.id} value={coach.id}>{coach.name}</MenuItem>)}</TextField><Button type="submit" variant="outlined">Open coach rate</Button></Stack></form>{snapshot.coachUserId&&snapshot.coachRate?<CoachRateEditor key={snapshot.coachUserId} coachUserId={snapshot.coachUserId} revision={snapshot.coachRate.revision} basisPoints={snapshot.coachRate.basisPoints} defaultBasisPoints={snapshot.platform.commissionBasisPoints}/>:null}</Stack></JournalAdminPanel>
  <JournalAdminPanel title="Community coaching"><Stack spacing={3}>{snapshot.communities.length?<form method="get"><Stack direction={{xs:'column',sm:'row'}} spacing={2}><TextField select name="communityId" label="Community" defaultValue={snapshot.communityId} sx={{minWidth:260}}>{snapshot.communities.map(c=><MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}</TextField><Button type="submit" variant="outlined">Open community policy</Button></Stack></form>:null}<Alert severity={snapshot.communityExemption?.state==='eligible'?'success':'info'}>Community coaching exemption: {snapshot.communityExemption?.available?snapshot.communityExemption.state:'not configured'}. Admission and fee exemption require separate owner decisions. This policy editor does not approve an exemption. <Button href="/admin/journal/communities/admission">Review admission and exemption</Button></Alert>{snapshot.community?<CoachingCommercialPolicyEditor key={snapshot.communityId} communityId={snapshot.communityId} initial={snapshot.community} revision={snapshot.communityRevision}/>:null}</Stack></JournalAdminPanel>
 </JournalAdminPage>;
}
