"use client";
import {lazy,Suspense} from 'react';
import Typography from '@mui/material/Typography';
import type {TradeAnalysisResourceModel} from './trade-analysis-page';
const Analysis=lazy(()=>import('./trade-analysis-client').then(module=>({default:module.TradeAnalysisClient})));
const Trades=lazy(()=>import('./analyzed-trades-index').then(module=>({default:module.AnalyzedTradesIndex})));
/** The normal report clients render a serializable model; no RSC client reference crosses an action. */
export function SavedAnalyzerResource({model}:{model:TradeAnalysisResourceModel}){
 return <Suspense fallback={<Typography role="status">Loading report…</Typography>}>{model.kind==='trades'?<Trades {...model.props}/>:<Analysis {...model.props}/>}</Suspense>;
}
