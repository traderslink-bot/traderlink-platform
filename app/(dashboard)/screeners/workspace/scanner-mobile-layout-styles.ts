import {mobileCardHeight,type MobileLayout} from './scanner-mobile-layout';
export function mobileWorkspaceStyles(layout:MobileLayout,height:number,landscape:boolean,tabbed:boolean){return {
        display:'grid',gridTemplateAreas:'none',height:tabbed?height:'auto',
        gridTemplateColumns:`repeat(${tabbed||!landscape?1:layout.columns}, minmax(0,1fr))`,
        gridTemplateRows:tabbed?'minmax(0,1fr)':undefined,gridAutoRows:tabbed?undefined:'8px',
        ...Object.fromEntries(layout.order.map((widget,index)=>{const h=mobileCardHeight(layout,widget,height,tabbed);return [`& > [data-scanner-workspace-card="${widget}"]`,{position:'relative',gridArea:'auto',order:index,height:h,minHeight:0,gridColumn:tabbed||!landscape||layout.columns===1?'auto':layout.wide.includes(widget)?'span 2':layout.placement?.[widget]??'auto',gridRow:tabbed?'auto':`span ${Math.ceil(h/8)}`}];})),
        '&& [data-traderlink-platform-dashboard-card="panel"]':{height:'100%',minHeight:0,overflow:'hidden'},
        '&& [data-traderlink-platform-dashboard-card="panel"] > .MuiCardContent-root':{height:'100%',minHeight:0,display:'flex',flexDirection:'column',overflow:'hidden'},
        '&& .MuiCardContent-root > .MuiBox-root:last-child':{flex:'1 1 0',display:'flex',flexDirection:'column',minHeight:0,overflow:'hidden'},
        '&& .MuiTableContainer-root,&& [role="list"],&& [data-scanner-results],&& [data-momentum-sections]':{maxHeight:'none !important',minHeight:0,flex:'1 1 0',overflowY:'auto'},
        '&& [data-market-events-fill-card]':{height:'100%',minHeight:0,overflow:'hidden'},
        '&& [aria-label="Latest PR Scanner releases"]':{flex:'1 1 0',maxHeight:'none',minHeight:0},
      };}
