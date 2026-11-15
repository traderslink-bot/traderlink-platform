import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

export function CoachingJournalSharingPrompt({href}:{href?:string}){
 return <Stack spacing={1} sx={{my:2}}><Typography sx={{fontWeight:700}}>Choose your Journal sharing</Typography><Typography variant="body2">Share notes and tags to give your coach context for your trades and trading sessions. You choose what to share and can change or revoke access later. Your coach reviews only what you allow.</Typography>{href?<Button href={href} variant="outlined" sx={{alignSelf:'flex-start'}}>Choose Journal sharing</Button>:<Typography variant="body2">After accepting this agreement, choose your Journal sharing.</Typography>}</Stack>;
}
