import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type {IndependentCoachWorkRow} from '@/src/modules/communities/server/independent-coaching-work-read';
import {workAction,workDestination,workKey,workLabel,workState,workStateColor,workProgressLines,workOverdue} from './work-presentation';

const dueFormatter=new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'});
export function IndependentCoachingWorkList({work,nowUtc,returnTo}:{work:readonly IndependentCoachWorkRow[];nowUtc:string;returnTo?:string}){
 if(!work.length)return <Typography>No scheduled or submitted work matches this view.</Typography>;
 return <>
  <Box sx={{display:{xs:'none',md:'block'},overflowX:'auto'}}><Box component="table" sx={{width:'100%',borderCollapse:'collapse','& th,& td':{textAlign:'left',p:1.5,borderBottom:1,borderColor:'divider',verticalAlign:'top'}}}><caption style={{textAlign:'left',position:'absolute',width:1,height:1,overflow:'hidden'}}>Scheduled and submitted coaching work, ordered by due date</caption><thead><tr><th scope="col">Student</th><th scope="col">Plan</th><th scope="col">Work</th><th scope="col">Progress</th><th scope="col">Due (Eastern)</th><th scope="col">Action</th></tr></thead><tbody>{work.map(row=><tr key={workKey(row)}><td>{row.studentName}</td><td>{row.planName}</td><td>{workLabel(row)}</td><td><Stack spacing={0.75}><Stack direction="row" sx={{gap:.75,flexWrap:'wrap'}}><Chip size="small" label={workState(row)} color={workStateColor(row)} variant="outlined"/>{workOverdue(row,nowUtc)?<Chip size="small" color="error" label="Overdue"/>:null}</Stack>{workProgressLines(row).map(line=><Typography key={line} variant="body2" color="text.secondary">{line}</Typography>)}</Stack></td><td><Typography component="span" color={workOverdue(row,nowUtc)?'error.main':'text.primary'}>{dueFormatter.format(new Date(row.dueAtUtc))}</Typography></td><td><Button href={workDestination(row,returnTo)}>{workAction(row)}</Button></td></tr>)}</tbody></Box></Box>
  <Stack spacing={2} sx={{display:{xs:'flex',md:'none'}}}>{work.map(row=><Box key={workKey(row)} sx={{p:2,border:1,borderColor:'divider',borderRadius:2}}><Stack spacing={1}><Typography sx={{fontWeight:700}}>{row.studentName}</Typography><Typography variant="body2">{row.planName}</Typography><Typography>{workLabel(row)}</Typography><Stack direction="row" sx={{gap:.75,flexWrap:'wrap'}}><Chip size="small" variant="outlined" label={workState(row)} color={workStateColor(row)}/>{workOverdue(row,nowUtc)?<Chip size="small" color="error" label="Overdue"/>:null}</Stack>{workProgressLines(row).map(line=><Typography key={line} variant="body2" color="text.secondary">{line}</Typography>)}<Typography variant="body2" color={workOverdue(row,nowUtc)?'error.main':'text.secondary'}>Due {dueFormatter.format(new Date(row.dueAtUtc))} Eastern</Typography><Box><Button variant="outlined" href={workDestination(row,returnTo)}>{workAction(row)}</Button></Box></Stack></Box>)}</Stack>
 </>;
}
