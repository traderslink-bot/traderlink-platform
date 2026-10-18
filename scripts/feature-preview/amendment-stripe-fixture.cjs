// Synthetic provider only, installed after deny-external by the disposable harness.
// Unknown Stripe paths fail closed. Never used by application runtime code.
exports.install=function(fixture){
  if(fixture.kind!=='traderlink_disposable_feature_preview_v1'||!fixture.addonStripe||!Array.isArray(fixture.addonStripe.subscriptions))throw Error('Synthetic amendment fixture required');
  process.env.STRIPE_SECRET_KEY='sk_test_synthetic_only';
  process.env.STRIPE_MEMBERSHIP_WEBHOOK_SECRET='synthetic_only';
  const oldFetch=global.fetch,prices=new Map(),invoices=new Map(),updates=new Map();
  const subscriptions=new Map(fixture.addonStripe.subscriptions.map(s=>[s.id,structuredClone(s)]));
  let count=0;
  function lines(sub,price,start){return {has_more:false,data:[
    {price:{id:sub.items.data[0].price.id},proration:true,amount:-1000,period:{start,end:sub.current_period_end}},
    {price:{id:price},proration:true,amount:1500,period:{start,end:sub.current_period_end}},
  ]};}
  global.fetch=async(input,init={})=>{
    const url=new URL(typeof input==='string'||input instanceof URL?input:input.url);
    if(url.origin!=='https://api.stripe.com')return oldFetch(input,init);
    const body=init.body instanceof URLSearchParams?init.body:new URLSearchParams(init.body),method=init.method||'GET',key=new Headers(init.headers).get('Idempotency-Key');
    let result;
    if(method==='POST'&&url.pathname==='/v1/prices'){
      if(!key?.startsWith('membership-addon-price-'))throw Error('Synthetic price identity required');
      const id='price_qa_'+key.slice('membership-addon-price-'.length).replaceAll('-','');
      result={id,currency:body.get('currency'),unit_amount:Number(body.get('unit_amount')),recurring:{interval:'month',interval_count:1}};prices.set(id,result);
    }else if(method==='POST'&&url.pathname==='/v1/invoices/create_preview'){
      const sub=subscriptions.get(body.get('subscription')),price=prices.get(body.get('subscription_details[items][0][price]'));
      if(!sub||!price)throw Error('Synthetic preview selection unavailable');
      result={currency:'usd',amount_due:500,starting_balance:0,lines:lines(sub,price.id,Number(body.get('subscription_details[proration_date]')))};
    }else if(url.pathname.startsWith('/v1/subscriptions/')){
      const id=decodeURIComponent(url.pathname.slice('/v1/subscriptions/'.length)),sub=subscriptions.get(id);
      if(!sub)throw Error('Synthetic subscription unavailable');
      if(method==='POST'){
        if(!key?.startsWith('membership-addon-confirm-')||body.get('payment_behavior')!=='pending_if_incomplete'||body.get('proration_behavior')!=='always_invoice')throw Error('Synthetic confirmed update required');
        if(updates.has(key))return Response.json(updates.get(key));
        const price=prices.get(body.get('items[0][price]'));if(!price)throw Error('Synthetic target price unavailable');
        const invoice={id:'in_qa_'+(++count),subscription:id,customer:sub.customer,billing_reason:'subscription_update',currency:'usd',amount_due:500,status:'paid',paid:true,lines:lines(sub,price.id,Number(body.get('proration_date')))};
        invoices.set(invoice.id,invoice);sub.items.data[0].price=price;sub.latest_invoice={id:invoice.id,status:'paid'};sub.pending_update=null;updates.set(key,structuredClone(sub));
      }
      result=sub;
    }else if(method==='GET'&&url.pathname.startsWith('/v1/invoices/'))result=invoices.get(decodeURIComponent(url.pathname.slice('/v1/invoices/'.length)));
    if(!result)throw Error('External payment request denied by synthetic harness');
    return Response.json(result);
  };
};
