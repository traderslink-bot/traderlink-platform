"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

export function normalizePressReleaseDetailText(value:string):string{
  return value.replace(/\\(?=[*_])/gu,"").replace(/\*\*/gu,"").trim().replace(/^_+|_+$/gu,"").trim();
}
function isGeneratedDataDisclaimer(value:string):boolean{
  return /^data generated\b/iu.test(value);
}
export function PressReleaseDetailSection({items,title}:{items:readonly string[];title:string}){
  const normalized=items.map(normalizePressReleaseDetailText).filter(Boolean);
  if(!normalized.length)return null;
  const details=normalized.filter(item=>!isGeneratedDataDisclaimer(item));
  const disclaimers=normalized.filter(isGeneratedDataDisclaimer);
  return <Box>
    <Typography component="h3" sx={{fontWeight:800}} variant="subtitle2">{title}</Typography>
    {details.length?<Stack component="ul" spacing={0.75} sx={{mb:0,mt:1,pl:2.5}}>
      {details.map((item,index)=><Typography component="li" key={`${title}-${index}`} variant="body2">{item}</Typography>)}
    </Stack>:null}
    {disclaimers.map((item,index)=><Typography color="text.secondary" data-generated-disclaimer key={`${title}-disclaimer-${index}`} sx={{display:"block",fontSize:"0.66rem",lineHeight:1.35,mt:details.length?0.9:1}}>{item}</Typography>)}
  </Box>;
}
