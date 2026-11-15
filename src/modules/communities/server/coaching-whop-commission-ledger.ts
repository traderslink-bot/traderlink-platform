import type {CoachingCommissionEntry} from '../contracts/coaching-commission-reconciliation';

/** Native dated financial_activity response; amount uses currency.precision, not Money decimals. */
export function normalizeCoachingCommissionLedgerPage(input:{platformAccountId:string;paymentId:string;page:unknown}):{entries:readonly CoachingCommissionEntry[];nextCursor:string|null}{
 if(!input.page||typeof input.page!=='object'||Array.isArray(input.page))throw new Error('Commission ledger response needs reconciliation.');
 const page=input.page as Record<string,unknown>;
 if(!Array.isArray(page.data)||!page.page_info||typeof page.page_info!=='object')throw new Error('Commission ledger response needs reconciliation.');
 const entries:CoachingCommissionEntry[]=[];
 for(const value of page.data){
  if(!value||typeof value!=='object')throw new Error('Invalid ledger entry.');const raw=value as Record<string,unknown>;
  const account=raw.account as {id?:unknown}|null,related=raw.payment as {id?:unknown}|null;
  if(account?.id!==undefined&&account.id!==input.platformAccountId)throw new Error('Commission ledger recipient mismatch.');
  if(raw.payment_id!==undefined&&raw.payment_id!==null&&related?.id!==undefined&&raw.payment_id!==related.id)throw new Error('Conflicting ledger payment reference.');
  const paymentId=raw.payment_id??related?.id;
  if(paymentId!==input.paymentId)continue;
  // Direct coaching uses child account markups, never guessed processing fees,
  // generic refunds or child debits as evidence of a parent commission credit.
  if(raw.line_type!=='platform_markup_fee_payout')continue;
  const currency=raw.currency as {code?:unknown;precision?:unknown}|undefined;
  if(raw.object!=='ledger_activity'||typeof raw.id!=='string'||!raw.id||typeof raw.amount!=='string'||!/^[-]?\d+$/.test(raw.amount)||typeof currency?.code!=='string'||!['usd','cad'].includes(currency.code.toLowerCase())||typeof currency.precision!=='string'||!/^\d+$/.test(currency.precision))throw new Error('Qualify this native commission ledger entry.');
  const precision=BigInt(currency.precision);if(precision<=BigInt(0))throw new Error('Invalid ledger precision.');
  const scaled=BigInt(raw.amount)*BigInt(100);if(scaled%precision!==BigInt(0))throw new Error('Commission cannot be represented in currency minor units.');
  const minor=scaled/precision;if(minor>BigInt(Number.MAX_SAFE_INTEGER)||minor<BigInt(Number.MIN_SAFE_INTEGER))throw new Error('Commission ledger amount exceeds safe storage range.');
  if(minor===BigInt(0))continue;
  entries.push({entryId:raw.id,paymentId:input.paymentId,receivingAccountId:input.platformAccountId,currency:currency.code.toUpperCase(),amountMinor:Number(minor),kind:minor>BigInt(0)?'credit':'reversal'});
 }
 const paging=page.page_info as Record<string,unknown>;
 if(typeof paging.has_next_page!=='boolean'||paging.has_next_page&&(typeof paging.end_cursor!=='string'||!paging.end_cursor))throw new Error('Commission pagination needs reconciliation.');
 return {entries,nextCursor:paging.has_next_page?paging.end_cursor as string:null};
}
