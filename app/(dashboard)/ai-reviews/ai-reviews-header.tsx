"use client";

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';

/** Resolve the active dashboard palette in the client provider. Preserve the
 * established Light header while keeping inherited body text readable in Navy. */
export function AiReviewsHeader({percentageUsed,showBenchmark}:{percentageUsed:number|null;showBenchmark:boolean}) {
  const theme=useTheme(),navy=theme.palette.mode==='dark';
  return <Box sx={{color:navy?theme.palette.text.primary:undefined}}>
    <Typography component="h1" variant="h1">AI Reviews</Typography>
    {percentageUsed!==null?<Stack spacing={0.5} sx={{maxWidth:360,mt:1.5}}>
      <Stack direction="row" sx={{justifyContent:'space-between'}}>
        <Typography sx={{color:navy?theme.palette.text.secondary:undefined}} variant="body2">AI Review usage</Typography>
        <Typography sx={{fontWeight:800}} variant="body2">{percentageUsed}% used</Typography>
      </Stack>
      <LinearProgress aria-label={`AI Review usage: ${percentageUsed}% used`} sx={{borderRadius:99,height:8}} value={percentageUsed} variant="determinate"/>
    </Stack>:null}
    <Typography sx={{maxWidth:760,mt:1,color:navy?theme.palette.text.secondary:undefined}} variant="body2">Turn verified trading results and anything you choose to save in Trade Tracker into a clear review of your week or month.</Typography>
    {showBenchmark?<Button href="/ai-reviews/benchmark-preview" size="small" sx={{mt:1.5}} variant="outlined">Preview power-user reviews</Button>:null}
  </Box>;
}
