// Exercise the private preview entrypoint locally or through private Codespaces forwarding.
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const http = require('node:http'), https = require('node:https');
const {execFileSync} = require('node:child_process');
const { chromium, expect } = require('@playwright/test');
const fixture = JSON.parse(fs.readFileSync(process.env.MEMBERSHIP_QA_FIXTURE, 'utf8'));
assert(fixture.dir.startsWith('/workspaces/private-data/membership-qa-fixtures/run-'));
const evidence = path.join(fixture.dir, 'evidence/all-owner-review');
const port = JSON.parse(fs.readFileSync(path.join(evidence, 'private-preview-port.json'), 'utf8'));
assert.equal(port.visibility, 'private');
const origin = port.browseUrl.replace(/\/$/, ''), host = new URL(origin).host;
const forwarded = process.env.MEMBERSHIP_QA_FORWARDED === '1';
if (forwarded) assert(process.env.GITHUB_TOKEN, 'Private forwarding requires configured Codespaces authentication');
let browser, page, proxy;
(async () => {
  // Use a real loopback TLS proxy so Chromium generates the same Origin and
  // secure-cookie behavior as private forwarding. Route.fetch redirects can
  // escape interception; overriding Origin on a loopback page is also invalid.
  if (!forwarded) {
  const key = path.join(evidence,'proxy-key.pem'), cert = path.join(evidence,'proxy-cert.pem');
  if (!fs.existsSync(key)) execFileSync('openssl',['req','-x509','-newkey','rsa:2048','-nodes',
    '-keyout',key,'-out',cert,'-days','1','-subj','/CN=synthetic-membership-proxy'],{stdio:'ignore'});
  fs.chmodSync(key,0o600);
  proxy = https.createServer({key:fs.readFileSync(key),cert:fs.readFileSync(cert)},(request,response)=>{
    const upstream = http.request({host:'127.0.0.1',port:3027,path:request.url,method:request.method,
      headers:{...request.headers,host:'localhost:3027',
        ...(request.headers.origin ? {origin:'http://localhost:3027'} : {}),
        'x-forwarded-host':host,'x-forwarded-proto':'https'}}, incoming=>{
      response.writeHead(incoming.statusCode,incoming.headers); incoming.pipe(response);
    });
    upstream.on('error',()=>{response.writeHead(502);response.end('Local review proxy unavailable');});
    request.pipe(upstream);
  });
  await new Promise((resolve,reject)=>{proxy.once('error',reject);proxy.listen(3443,'127.0.0.1',resolve);});
  }
  browser = await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage',
    ...(!forwarded ? ['--no-proxy-server',`--host-resolver-rules=MAP ${host} 127.0.0.1:3443`] : [])]});
  const context = await browser.newContext({serviceWorkers:'block',ignoreHTTPSErrors:!forwarded,
    ...(forwarded ? {extraHTTPHeaders:{'X-Tunnel-Skip-AntiPhishing-Page':'true'}} : {})});
  await context.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.origin !== origin) return route.abort();
    await route.continue(forwarded ? {headers:{...await route.request().allHeaders(),
      'X-Github-Token':process.env.GITHUB_TOKEN}} : {});
  });
  const p = page = await context.newPage();
  p.setDefaultTimeout(15000);
  p.on('response', response => { if (response.request().isNavigationRequest()) console.log('Navigation', response.status(), new URL(response.url()).pathname); });
  p.on('dialog', dialog => dialog.accept());
  await p.goto(origin + '/__membership-qa');
  const continueToCodespace = p.getByText('Continue',{exact:true});
  if (forwarded && await continueToCodespace.isVisible()) await continueToCodespace.click();
  await expect(p.getByRole('heading',{name:'Membership editor review'})).toBeVisible();
  await p.getByRole('button',{name:'Review as owner',exact:true}).click();
  await p.waitForURL('**/admin/journal/memberships?section=Plans');
  const consent = p.getByRole('button',{name:'Reject optional',exact:true});
  await consent.waitFor({state:'visible'});
  await consent.click();
  await p.getByRole('button',{name:'New plan',exact:true}).click();
  await expect(p.getByLabel('Plan name',{exact:true})).toHaveValue('');
  await p.getByLabel('Plan name',{exact:true}).fill('QA review smoke D');
  await p.getByRole('button',{name:'Save draft and close',exact:true}).click();
  await expect(p.getByRole('status').filter({hasText:'Draft saved'})).toBeVisible();
  await p.getByRole('button',{name:'Delete draft',exact:true}).click();
  await expect(p.getByText('No plans yet. Select New plan to create your first plan.')).toBeVisible();
  const cookie = (await context.cookies()).find(cookie => cookie.name === 'tl_platform_session');
  assert(cookie?.httpOnly && cookie.secure && cookie.sameSite === 'Lax');
  await p.screenshot({path:path.join(evidence,'review-owner-empty.png')});
  for (const role of ['A','B']) {
    await p.goto(origin + '/__membership-qa');
    await p.getByRole('button',{name:'Review as member ' + role,exact:true}).click();
    await p.waitForURL('**/plans');
    await expect(p.getByRole('heading',{name:'Plans',exact:true})).toBeVisible();
  }
  await browser.close();
  proxy?.close();
  fs.writeFileSync(path.join(evidence,forwarded ? 'forwarded-review-smoke.json' : 'review-smoke.json'),JSON.stringify({status:'PASS',
    boundary:forwarded ? 'Actual private GitHub Codespaces forwarded URL; authenticated scoped browser requests' : 'Local browser proxy simulation including observed Codespaces origin rewriting',
    syntheticLogin:true,memberAandBLogin:true,secureHttpOnlyCookie:true,createSaveDeleteDraft:true,
    ownerReviewStillPending:true},null,2));
  console.log('PASS private review entrypoint, synthetic login, secure cookie and create/save/delete draft');
})().catch(async error => {
  let message = String(error.message);
  if (page) message += '\nCurrent page: ' + new URL(page.url()).pathname + '\n' + (await page.locator('body').innerText().catch(() => '')).slice(0, 1500);
  for (const user of Object.values(fixture.users)) message = message.replaceAll(user.token,'[synthetic session redacted]');
  if (process.env.GITHUB_TOKEN) message = message.replaceAll(process.env.GITHUB_TOKEN,'[GitHub authentication redacted]');
  console.error(message); await browser?.close(); proxy?.close(); process.exitCode=1;
});
