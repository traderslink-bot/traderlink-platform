import MuiTypography from "@mui/material/Typography";
import type {TypographyProps} from "@mui/material/Typography";

export function CommunityTypography({fontWeight,style,...props}:TypographyProps&{fontWeight?:number}){
 return <MuiTypography {...props} style={{...style,fontWeight}}/>;
}
