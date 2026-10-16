// Sandbox-only webhook receiver. No dashboard routes, sessions or customer UI.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const profile=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
const fixture=JSON.parse(fs.readFileSync(profile.fixture,'utf8'));
if(profile.mode!=='stripe-sandbox'||fixture.kind!=='traderlink_disposable_feature_preview_v1'||
 fixture.env.TRADERLINK_PLATFORM_DB_PATH!==path.join(fixture.dir,'qa.sqlite')||
 !process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_'))throw Error('Disposable sandbox profile and test key required');
Object.assign(process.env,fixture.env,{NODE_ENV:'development',TRADERLINK_MEMBERSHIP_APP_ORIGIN:profile.origin});
const Module=require('node:module'),load=Module._load;
Module._load=function(id,...args){return id==='server-only'?{}:load.call(this,id,...args)};
require('tsx/cjs');
const {POST}=require('../../app/api/webhooks/membership-stripe/route.ts');
const secretFile=path.join(fixture.dir,'stripe-webhook.json');
const server=http.createServer(async(req,res)=>{
 res.setHeader('cache-control','no-store');
 if(req.method==='GET'&&req.url==='/health'){res.writeHead(200);res.end('Sandbox receiver');return;}
 if(req.method!=='POST'||req.url!=='/api/webhooks/membership-stripe'){res.writeHead(404);res.end();return;}
 let size=0;const chunks=[];
 try{
  for await(const chunk of req){size+=chunk.length;if(size>1_000_000){res.writeHead(413);res.end();return;}chunks.push(chunk);}
  const raw=Buffer.concat(chunks).toString('utf8');
  // Never hydrate a live event, even if configuration is accidentally mixed.
  const event=JSON.parse(raw);if(event.livemode!==false){res.writeHead(400);res.end();return;}
  if(!fs.existsSync(secretFile)){res.writeHead(503);res.end();return;}
  const config=JSON.parse(fs.readFileSync(secretFile,'utf8'));
  if(!config.secret?.startsWith('whsec_'))throw Error('Sandbox signing configuration required');
  process.env.STRIPE_MEMBERSHIP_WEBHOOK_SECRET=config.secret;
  const response=await POST(new Request(profile.origin+req.url,{method:'POST',headers:{'stripe-signature':req.headers['stripe-signature']||''},body:raw}));
  res.writeHead(response.status,{'content-type':'application/json'});res.end(await response.text());
  console.log('Sandbox webhook response '+response.status);
 }catch{res.writeHead(400);res.end();}
});
server.requestTimeout=30_000;server.headersTimeout=10_000;
server.listen(profile.port,'0.0.0.0',()=>console.log('Sandbox-only webhook receiver ready'));
process.on('SIGTERM',()=>server.close(()=>process.exit(0)));
