import Box from "@mui/material/Box";
import type { ReactNode } from "react";

export type ScannerWorkspaceCardSlot="gainers"|"momentum"|"top-losers"|"high-drops"|"market-events";

/** Keeps every card in the Screeners workspace on one spacing contract. */
export function ScannerWorkspaceCard({children,slot}:{children:ReactNode;slot:ScannerWorkspaceCardSlot}){
  return <Box data-scanner-workspace-card={slot} sx={{minWidth:0,'& .MuiCardContent-root':{p:1.25,'&:last-child':{pb:1.25}}}}>{children}</Box>;
}
