const fs = require('fs'), path = require('path'), assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../..'), req = require('node:module').createRequire(root + '/package.json');
const { build } = req('esbuild'), { chromium } = req('playwright');
const out = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'coaching-ux-regression-'));
(async () => {
    const actions = fs.readFileSync(root + '/app/(dashboard)/communities/community-actions.ts', 'utf8');
    const names = [...actions.matchAll(/export async function (\w+)/g)].map(m => m[1]);
    const contents = `import React from 'react';import {createRoot} from 'react-dom/client';import {ThemeProvider,CssBaseline,Box} from '@mui/material';import {createTraderMaterialTheme} from './app/mui-theme';import {createTraderLinkCommunityReviewFixture} from './src/modules/communities/server/traderlink-community-review-fixture';import {CoachSetupPage} from './app/(dashboard)/communities/coach-setup-page';import {StudentsPage,CoachingWorkPage} from './app/(dashboard)/communities/coach-workspace-navigation';import {ReviewsPage,SessionsPage,TeachingPage} from './app/(dashboard)/communities/coaching-program-pages';import {CoachTradeReviewWorkspacePersistent} from './app/(dashboard)/communities/coach-trade-review-workspace-persistent';import {StudentCoachingWorkspace} from './app/(dashboard)/communities/student-coaching-workspace';import StudentPage from './app/(dashboard)/communities/[communitySlug]/workspace/students/[relationshipId]/page';import ReviewPage from './app/(dashboard)/communities/[communitySlug]/workspace/students/[relationshipId]/reviews/[reviewId]/page';import FinalPage from './app/(dashboard)/communities/[communitySlug]/workspace/students/[relationshipId]/reviews/[reviewId]/final/page';
const q=new URLSearchParams(location.search),state=q.get('state')||'populated',screen=q.get('screen')||'setup';let s=structuredClone(createTraderLinkCommunityReviewFixture(screen==='my-coaching'?'student':'coach'));s.community.slug='qa-ux';s.coachingAttachments=[];s.journalGrants=[];s.coachingRoleOptions=[{id:'910002',name:'QA Coaching students'}];s.agreements=[];s.tradeReviews=s.tradeReviews.map(r=>({...r,workspaceKind:'trade',agreedTradeCount:1,acceptanceState:'accepted',focusAreas:['overall','next_steps']}));if(state==='empty'||state==='new'){for(const key of ['relationships','tradeReviews','reviewTrades','reviewActions','reviewReplies','reviewEvents','coachingTasks','coachingMessages','coachingRecords','coachingSessions','teachingItems','coachingAttachments','journalGrants'])s[key]=[];s.plans=[];s.coaches=state==='new'?[]:s.coaches.filter(c=>c.userId===s.viewer.userId).map(c=>({...c,activeStudents:0}));}
if(state==='multi-session'&&s.coachingSessions.length){s.coachingSessions.push({...s.coachingSessions[0],sessionId:'10000000-0000-4000-8000-000000000099',title:'QA second session'});}if(state==='declined'){s.relationships=s.relationships.map(r=>({...r,status:'declined'}));}if(state==='pending'){s.relationships=s.relationships.map(r=>({...r,status:'pending'}));}
if(state==='paused'){s.relationships=s.relationships.map(r=>({...r,accessStatus:'access_paused',accessPauseReason:'required_role_missing'}));}
if(state==='ready'){s.reviewTrades=s.reviewTrades.map(r=>({...r,workflowState:'saved',coachFeedback:'QA synthetic saved feedback'}));}
if(state==='delivered'){s.tradeReviews[0].deliveryState='delivered';s.tradeReviews[0].deliveredAtUtc='2026-10-15T14:00:00.000Z';s.reviewTrades=s.reviewTrades.map(r=>({...r,workflowState:'saved',coachFeedback:'QA synthetic saved feedback'}));}
if(q.get('mixed')==='1'){s.viewer.capabilities.push('community.coaching.offer');}window.snapshot=s;window.actionCalls=[];window.refreshes=0;const params=Promise.resolve({communitySlug:s.community.slug,relationshipId:s.relationships[0]?.relationshipId,reviewId:s.tradeReviews[0]?.reviewId});async function view(){switch(screen){case'my-coaching':return <StudentCoachingWorkspace snapshot={s} isReview={false}/>;case'setup':return <CoachSetupPage snapshot={s}/>;case'students':return <StudentsPage snapshot={s}/>;case'work':return <CoachingWorkPage snapshot={s}/>;case'reviews':return <ReviewsPage snapshot={s}/>;case'sessions':return <SessionsPage snapshot={s}/>;case'teaching':return <TeachingPage snapshot={s} isReview={false}/>;case'trades':return <CoachTradeReviewWorkspacePersistent communitySlug='qa-ux' relationshipId='qa-relation' reviewId='qa-review' trades={[{roundTripId:'qa-trade-1',symbol:'QAONE',direction:'long',openedAtUtc:'2026-10-14T14:00:00.000Z',closedAtUtc:'2026-10-14T15:00:00.000Z',state:'ready_closed',quantityDecimal:'1',entryPriceDecimal:'10',exitPriceDecimal:'11',netPnlDecimal:'1',grossPnlDecimal:'1',currency:'USD'}]} initialSelections={[]} actions={[]} attachments={[]} isReview={true}/>;case'student':return await StudentPage({params,searchParams:Promise.resolve({})});case'review':return await ReviewPage({params});case'final':return await FinalPage({params});}}view().then(v=>createRoot(document.getElementById('root')).render(<ThemeProvider theme={createTraderMaterialTheme(q.get('theme')==='dark'?'dark':'light')}><CssBaseline/><Box sx={{p:2,maxWidth:1400,mx:'auto'}}>{v}</Box></ThemeProvider>)).catch(e=>{window.renderError=e.message;document.body.innerText='Fixture rendering error: '+e.message});`;
    const bundle = await build({ absWorkingDir: root, bundle: true, write: false, format: 'iife', platform: 'browser', jsx: 'automatic', define: { 'process.env.NODE_ENV': '"production"', 'process.env': '{}' }, stdin: { resolveDir: root, loader: 'tsx', contents }, plugins: [{ name: 'isolated-boundaries', setup(b) {
                    b.onResolve({ filter: /^server-only$/ }, () => ({ path: 'empty', namespace: 'qa-empty' }));
                    b.onLoad({ filter: /.*/, namespace: 'qa-empty' }, () => ({ contents: 'export {};', loader: 'ts' }));
                    b.onResolve({ filter: /^next\/(link|navigation)$/ }, a => ({ path: a.path, namespace: 'qa-next' }));
                    b.onLoad({ filter: /.*/, namespace: 'qa-next' }, a => ({ resolveDir: root, loader: 'tsx', contents: a.path === 'next/link' ? `import React from 'react';export default React.forwardRef(function Link({href,prefetch,...p},ref){return <a {...p} href={typeof href==='string'?href:href.pathname} ref={ref}/>})` : `export function useRouter(){return {refresh(){window.refreshes++},push(p){location.href=p}}}export function usePathname(){return '/communities/qa-ux/workspace'}export function useSearchParams(){return new URLSearchParams(location.search)}export function notFound(){throw new Error('QA not found')}export function redirect(){throw new Error('QA redirect')}` }));
                    b.onLoad({ filter: /\/community-actions\.ts$/ }, () => ({ loader: 'ts', contents: names.map(n => `export async function ${n}(...args){window.actionCalls.push({name:'${n}',data:Object.fromEntries(args.at(-1) instanceof FormData?args.at(-1):[])});if(window.actionMode==='deferred')await new Promise(resolve=>(window.pendingActions??=[]).push(resolve));return {error:window.actionMode==='error'?'QA rejected save; entries retained':'',message:'QA isolated response',status:window.actionMode==='error'?'error':'success'}}`).join('\n') }));
                    b.onLoad({ filter: /\/coaching-analysis-actions\.ts$/ }, () => ({ loader: 'ts', contents: "export async function loadCoachingAnalyzerAction(){return {status:'unavailable'}};export async function loadCoachingAnalysisAction(){return {status:'unavailable'}}" }));
                    b.onLoad({ filter: /\/community-dashboard-loader\.ts$/ }, () => ({ loader: 'ts', contents: `export async function loadCommunityDashboard(){return {snapshot:window.snapshot}}` }));
                    b.onLoad({ filter: /\/open-readonly-platform-database\.ts$/ }, () => ({ loader: 'ts', contents: `export function withReadonlyPlatformDatabase(){throw new Error('Hosted database access blocked in UX fixture')}` }));
                    b.onLoad({ filter: /\/require-platform-request-scope\.ts$/ }, () => ({ loader: 'ts', contents: `export async function requireTraderLinkPlatformServerComponentPageIdentity(){return {scope:{userId:window.snapshot.viewer.userId}}}` }));
                    b.onLoad({ filter: /\/traderlink-community-coach-journal-read-service\.ts$/ }, () => ({ loader: 'ts', contents: `export class TraderLinkCommunityCoachJournalReadService{constructor(){throw new Error('Journal reader blocked in UX fixture')}}` }));
                    b.onLoad({ filter: /\/trading-view-chart\.tsx$/ }, () => ({ loader: 'tsx', contents: `export function TradingViewChart(){return <div>Chart provider excluded from isolated UX audit</div>}` }));
                } }] });
    fs.writeFileSync(out + '/bundle.js', bundle.outputFiles[0].text);
    const browser = await chromium.launch({ headless: true });
    const results = [];
    try {
        for (const theme of ['light', 'dark'])
            for (const width of [1440, 390]) {
                const context = await browser.newContext({ viewport: { width, height: 844 }, timezoneId: 'America/Toronto' });
                const page = await context.newPage(), errors = [], external = [];
                page.on('pageerror', error => errors.push(error.message));
                await context.route('**/*', route => { const url = new URL(route.request().url()); if (url.hostname !== 'coach-ux.invalid') {
                    external.push(url.hostname);
                    return route.abort();
                } return route.fulfill(url.pathname === '/bundle.js' ? { contentType: 'text/javascript', body: bundle.outputFiles[0].text } : { contentType: 'text/html', body: '<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><div id="root"></div><script src="/bundle.js"></script>' }); });
                async function go(screen, state = 'populated', mixed = false) { await page.goto('https://coach-ux.invalid/?' + new URLSearchParams({ screen, state, theme, mixed: mixed ? '1' : '0' })); await page.waitForFunction(() => document.querySelector('h1,h2,h3') || window.renderError); assert.equal(await page.evaluate(() => window.renderError || null), null); }
                async function capture(name) { if (await page.getByRole('dialog').count())
                    await page.waitForFunction(() => [...document.querySelectorAll('[role=dialog]')].every(el => getComputedStyle(el.closest('.MuiDialog-container') ?? el).opacity === '1')); assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Document overflow: ' + name); await page.screenshot({ path: path.join(out, theme + '-' + width + '-' + name + '.png'), fullPage: false }); }
                async function discard() { await page.getByRole('button', { name: 'Discard changes', exact: true }).click(); await page.getByRole('dialog').waitFor({ state: 'hidden' }); }
                if (process.env.COACHING_UX_EDGE_QA === '1') {
                    const observations = await require(process.env.COACHING_UX_THIRD_QA === '1' ? './verify-coaching-usability-third-qa.cjs' : './verify-coaching-usability-edges.cjs')({page, go, capture, discard, assert});
                    assert.deepEqual(errors, []); assert.deepEqual(external, []);
                    results.push({theme, width, height:844, observations, scope:'isolated actual components; deferred synthetic actions; no hosted writes'});
                    console.log(JSON.stringify(results.at(-1)));
                    await context.close();
                    continue;
                }
                await go('setup', 'new');
                assert(await page.getByText('Save your coach profile first, then create a plan below.', { exact: true }).isVisible());
                assert.equal(await page.getByRole('textbox', { name: 'Plan name', exact: true }).count(), 0);
                await capture('new-coach');
                for (const screen of ['work', 'students', 'reviews', 'sessions']) {
            await go(screen, 'empty');
            assert.equal(await page.getByRole('link', {name:'Create a plan',exact:true}).getAttribute('href'), '/communities/qa-ux/workspace/setup#coach-plan-builder');
        }
        await go('work', 'new');
        assert.equal(await page.getByRole('link', {name:'Set up coach profile',exact:true}).getAttribute('href'), '/communities/qa-ux/workspace/setup');
        await go('setup', 'empty');
                await page.getByRole('button', { name: 'Performance review', exact: true }).click();
                const publishPlan = page.getByRole('button', { name: 'Publish plan', exact: true });
                assert(await publishPlan.isDisabled());
                await page.getByRole('button', { name: 'Choose coaching role', exact: true }).click();
                const role = page.getByRole('combobox', { name: 'Discord coaching role', exact: true });
                assert(await role.isVisible());
                assert(await role.evaluate(el => el === document.activeElement));
                await role.click();
                await page.getByRole('option', { name: 'QA Coaching students', exact: true }).click();
                assert(await publishPlan.isEnabled());
                await go('setup');
                const planName = page.getByRole('textbox', { name: 'Plan name', exact: true });
                await planName.fill('QA UNSAVED PLAN');
                await page.getByRole('button', { name: 'Edit', exact: true }).first().click();
                await page.getByRole('dialog').waitFor();
                await page.getByRole('button', { name: 'Keep editing', exact: true }).click();
                assert.equal(await planName.inputValue(), 'QA UNSAVED PLAN');
                await page.getByRole('button', { name: 'Edit', exact: true }).first().click();
                await capture('draft-protection');
                await discard();
                await page.waitForFunction(() => document.activeElement?.id === 'coach-plan-builder');
                assert.equal(await planName.inputValue(), 'Momentum Accountability');
                await planName.fill('QA UNSAVED EXISTING');
                await page.getByRole('button', { name: 'Cancel edit', exact: true }).click();
                await page.keyboard.press('Escape');
                assert.equal(await planName.inputValue(), 'QA UNSAVED EXISTING');
                await page.getByRole('button', { name: 'Cancel edit', exact: true }).click();
                await discard();
                assert.equal(await planName.inputValue(), '');
                await go('teaching', 'empty');
                const lessonTitle = page.getByRole('textbox', { name: 'Title', exact: true }).first();
                await lessonTitle.fill('QA EMPTY DRAFT');
                assert(await page.getByRole('button', { name: 'Publish lesson', exact: true }).isDisabled());
                assert.equal(await page.getByRole('checkbox', { name: 'Publish', exact: true }).count(), 0);
                assert.equal(await page.getByRole('combobox', { name: 'Plan', exact: true }).count(), 0);
                await page.evaluate(() => window.actionMode = 'error');
                await lessonTitle.press('Enter');
                await page.getByRole('alert').filter({ hasText: 'QA rejected save' }).waitFor();
                assert.equal(await lessonTitle.inputValue(), 'QA EMPTY DRAFT');
                assert.equal(await page.evaluate(() => window.actionCalls.at(-1).data.publish), '');
                await capture('private-draft');
                await go('teaching');
                const audience = page.getByRole('combobox', { name: 'Audience', exact: true });
                await audience.click();
                await page.getByRole('option', { name: 'Plan', exact: true }).click();
                await page.getByRole('combobox', { name: 'Plan', exact: true }).click();
                await page.getByRole('option', { name: 'Weekly Trade Review', exact: true }).click();
                assert(await page.getByRole('button', { name: 'Publish lesson', exact: true }).isDisabled());
                await audience.click();
                await page.getByRole('option', { name: 'Selected students', exact: true }).click();
                assert.equal(await page.getByRole('combobox', { name: 'Plan', exact: true }).count(), 0);
                await page.getByRole('checkbox', { name: 'Alex Rivers', exact: true }).check();
                assert(await page.getByRole('button', { name: 'Publish lesson', exact: true }).isEnabled());
                await lessonTitle.fill('QA SELECTED LESSON');
                await page.getByRole('button', { name: 'Publish lesson', exact: true }).click();
                await page.waitForFunction(() => window.actionCalls.length === 1);
                assert.deepEqual(await page.evaluate(() => ({ publish: window.actionCalls[0].data.publish, audience: window.actionCalls[0].data.audienceMode, plan: window.actionCalls[0].data.planId ?? null })), { publish: 'on', audience: 'selected_students', plan: null });
                await go('teaching');
                await lessonTitle.fill('QA UNSAVED LESSON');
                await page.getByRole('button', { name: 'Reuse', exact: true }).click();
                await page.getByRole('button', { name: 'Keep editing', exact: true }).click();
                assert.equal(await lessonTitle.inputValue(), 'QA UNSAVED LESSON');
                await page.getByRole('button', { name: 'Reuse', exact: true }).click();
                await discard();
                await page.waitForFunction(() => document.activeElement?.id === 'coach-lesson-composer');
                assert.equal(await lessonTitle.inputValue(), 'Building an opening-range plan');
                await capture('reused-lesson');
                await go('reviews');
                const reviewLinks = await page.getByRole('link', { name: 'Open review', exact: true }).evaluateAll(els => els.map(el => el.getAttribute('href')));
                assert(reviewLinks.length && reviewLinks.every(href => href.includes('/reviews/')));
                await go('sessions');
                assert((await page.locator('body').innerText()).includes('UTC'));
                assert((await page.getByRole('link', { name: 'Open session', exact: true }).getAttribute('href')).includes('#coaching-session-'));
                await go('student', 'paused');
                assert(await page.getByText('Coaching access paused', { exact: true }).isVisible());
                assert(await page.getByText(/student.*linked Discord account is missing/).isVisible());
                assert(await page.getByRole('button', { name: 'Save access', exact: true }).isDisabled());
                await go('student');
                assert(await page.getByText(/Only the student can grant Journal access/).isVisible());
                const sendImage = page.getByRole('button', { name: 'Send image', exact: true });
                assert(await sendImage.isDisabled());
                const image = page.locator('input[type="file"][name="image"]');
                await image.setInputFiles({ name: 'QA ONLY preview.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAPAAAABkCAIAAAA3wCqQAAABJ0lEQVR4nO3SUQkAIBTAwGcRY9k/iiUEYRxcgH1s1j6QMd8L4CFDk2JoUgxNiqFJMTQphibF0KQYmhRDk2JoUgxNiqFJMTQphibF0KQYmhRDk2JoUgxNiqFJMTQphibF0KQYmhRDk2JoUgxNiqFJMTQphibF0KQYmhRDk2JoUgxNiqFJMTQphibF0KQYmhRDk2JoUgxNiqFJMTQphibF0KQYmhRDk2JoUgxNiqFJMTQphibF0KQYmhRDk2JoUgxNiqFJMTQphibF0KQYmhRDk2JoUgxNiqFJMTQphibF0KQYmhRDk2JoUgxNiqFJMTQphibF0KQYmhRDk2JoUgxNiqFJMTQphibF0KQYmhRDk2JoUgxNiqFJMTQphibF0KQYmhRDk2JoUi5ikts34wgvVwAAAABJRU5ErkJggg==', 'base64') });
                assert(await page.getByText('QA ONLY preview.png', { exact: true }).isVisible());
                assert(await sendImage.isEnabled());
                assert(await page.getByRole('img', { name: 'Selected chart preview', exact: true }).isVisible());
                await sendImage.scrollIntoViewIfNeeded();
            await page.waitForFunction(() => {const image=document.querySelector('img[alt="Selected chart preview"]');return image?.complete&&image.naturalWidth>0;});
            await capture('image-selection');
                await page.getByRole('button', { name: 'Remove selected image', exact: true }).click();
                assert(await sendImage.isDisabled());
                assert.equal(await image.evaluate(el => el.files.length), 0);
                await image.setInputFiles({ name: 'QA invalid.txt', mimeType: 'text/plain', buffer: Buffer.from('QA ONLY') });
                assert(await page.getByRole('alert').isVisible());
                assert(await sendImage.isDisabled());
                assert.deepEqual(await page.evaluate(() => window.actionCalls), []);
                await go('review');
                assert(await page.getByRole('textbox', { name: 'Private coach notes', exact: true }).isVisible());
                for (const state of ['pending', 'declined']) {
                    await go('my-coaching', state, true);
                    assert(await page.getByText(state === 'pending' ? 'Awaiting coach response' : 'Request declined', { exact: true }).isVisible());
                    assert(await page.getByRole('link', { name: 'Coach workspace', exact: true }).isVisible());
                    assert(await page.getByRole('link', { name: 'Browse coaches', exact: true }).isVisible());
                    assert.equal(await page.getByText('No active coaching', { exact: true }).count(), 0);
                    assert.equal(await page.getByText('Journal sharing', { exact: true }).count(), 0);
                    await capture('my-coaching-' + state);
                }
                assert.deepEqual(errors, []);
                assert.deepEqual(external, []);
                results.push({ theme, width, height: 844, draftGuards: true, explicitLessonActions: true, recipientScoping: true, failedDraftRetained: true, privateNotes: true, selectedImage: true, pendingRequest: true, scope: 'isolated actual components; no hosted writes' });
                console.log(JSON.stringify(results.at(-1)));
                await context.close();
            }
    }
    finally {
        await browser.close();
    }
    fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify(results, null, 2));
    console.log(JSON.stringify({ artifacts: out }));
})().catch(error => { console.error(error); process.exitCode = 1; });
