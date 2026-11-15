"use client";

import MuiTypography from "@mui/material/Typography";
import type {TypographyProps} from "@mui/material/Typography";
import {useTheme} from "@mui/material/styles";

export function CommunityTypography({fontWeight,style,...props}:TypographyProps&{fontWeight?:number}){
 const theme=useTheme();
 const color=props.color==="text.secondary"?theme.palette.text.secondary:props.color==="text.primary"?theme.palette.text.primary:undefined;
 return <MuiTypography {...props} style={{color,...style,fontWeight}}/>;
}
