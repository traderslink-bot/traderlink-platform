import Box from "@mui/material/Box";
import type { ReactNode } from "react";
import type { ScannerWorkspaceSlotId, ScannerWorkspaceWidget } from "./scanner-workspace-layout";

/** Keeps every card in the Screeners workspace on one spacing contract. */
export function ScannerWorkspaceCard({children,slot,widget,contentPaddingTop=1.25}:{
  children:ReactNode;slot:ScannerWorkspaceSlotId;widget:ScannerWorkspaceWidget;contentPaddingTop?:number;
}){
  return <Box data-scanner-workspace-card={widget} data-scanner-workspace-slot={slot} sx={{
    gridArea:{xs:"auto",md:slot},
    height:{xs:"auto",md:"100%"},
    minHeight:0,
    minWidth:0,
    overflow:"hidden",
    '& > [data-traderlink-platform-dashboard-card="panel"]':{height:{xs:"auto",md:"100%"},minHeight:0},
    '& > [data-traderlink-platform-dashboard-card="panel"] > .MuiCardContent-root':{
      display:{xs:"block",md:"flex"},
      flexDirection:"column",
      height:{xs:"auto",md:"100%"},
      minHeight:0,
      overflow:{xs:"visible",md:"hidden"},
      p:1.25,
      pt:contentPaddingTop,
      '&:last-child':{pb:1.25},
    },
    // DashboardPanel wraps its children in a Box. Bound that body as well as
    // CardContent so table rows scroll instead of growing beneath the card.
    '& > [data-traderlink-platform-dashboard-card="panel"] > .MuiCardContent-root > .MuiBox-root:last-child':{
      display:{md:"flex"},
      flexDirection:"column",
      flex:{md:"1 1 auto"},
      minHeight:0,
      minWidth:0,
      overflow:{md:"hidden"},
      // Scanner bodies grow with the layout slot. Intrinsic controls and rapid
      // drop rows keep their height while the results use the remaining space.
      '& > :not(.MuiTableContainer-root):not([role="list"]):not([data-momentum-sections]):not([data-scanner-results])':{flexShrink:0},
      '& > [role="list"], & > [data-momentum-sections], & > [data-scanner-results]':{
        flex:{md:"1 1 0"},
        maxHeight:{md:"none"},
        minHeight:0,
      },
      '& > [data-scanner-results]':{
        overflow:{md:"hidden"},
        '& > :not(.MuiTableContainer-root):not([role="list"])':{flexShrink:0},
        '& > [role="list"]':{flex:{md:"1 1 0"},maxHeight:{md:"none"},minHeight:0},
      },
      '& [data-momentum-sections] [role="list"]':{maxHeight:{md:"none"}},
    },
    '& .MuiTableContainer-root':{
      flex:{md:"1 1 auto"},
      maxHeight:{md:"none !important"},
      minHeight:{md:0},
      overflow:{md:"auto"},
    },
  }}>{children}</Box>;
}
