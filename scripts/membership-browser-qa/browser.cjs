const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const requireApp = require('node:module').createRequire(path.join(process.cwd(), 'package.json'));
const { chromium } = requireApp('@playwright/test');
const expect = requireApp('@playwright/test').expect.configure({ timeout: 20000 });
const Database = requireApp('better-sqlite3');
const crypto = require('node:crypto');
const Module = require('node:module'), originalLoad = Module._load;
Module._load = function (id, ...args) { return id === 'server-only' ? {} : originalLoad.call(this, id, ...args); };
requireApp('tsx/cjs');
const src = id => requireApp('./src/' + id);
const { evaluateMembershipFeature } = src('modules/platform/server/membership/platform-membership-access.ts');
const { readGenerationAllowance } = src('modules/platform/server/membership/platform-membership-generation-allowance.ts');
const { privateWatchlistRemaining } = src('modules/watchlist/server/private/private-watchlist-allowance.ts');
const { PrivateWatchlistRepository } = src('modules/watchlist/server/private/private-watchlist-repository.ts');
const { readMembershipNewsDelaySeconds } = src('modules/platform/server/membership/membership-news-delay.ts');
const { PlatformMembershipRepository } = src('modules/platform/server/membership/platform-membership-repository.ts');
const fixture = JSON.parse(fs.readFileSync(process.env.MEMBERSHIP_QA_FIXTURE, 'utf8'));
const evidence = process.env.MEMBERSHIP_QA_EVIDENCE;
fs.mkdirSync(evidence,{recursive:true});
Object.assign(process.env,fixture.env);
function withDb(fn){const db=new Database(fixture.env.TRADERLINK_PLATFORM_DB_PATH);db.pragma('foreign_keys=ON');try{return fn(db)}finally{db.close()}}
// Refresh only the explicitly seeded fake owner's evidence during a long run.
function refreshSyntheticOwner(){withDb(db=>db.prepare('UPDATE platform_discord_memberships SET last_verified_at_utc=? WHERE user_id=? AND guild_id=?').run(new Date().toISOString(),fixture.users.owner.userId,fixture.env.DISCORD_GUILD_ID))}
const steps=[];
function pass(step){steps.push({step,status:'PASS'});fs.writeFileSync(path.join(evidence,'steps.json'),JSON.stringify(steps,null,2));process.stdout.write('PASS '+step+'\n')}
let launched;
const url = 'http://127.0.0.1:3027', admin = url + '/admin/journal/memberships?section=Plans';
(async () => {
    const browser = launched = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage', '--renderer-process-limit=2'] });
    const errors = [], blocked = [];
    async function context(name) { const c = await browser.newContext({ viewport: { width: 1440, height: 1000 }, serviceWorkers: 'block' }); c.setDefaultNavigationTimeout(120000); await c.route('**/*', route => { const u = new URL(route.request().url()); if (u.hostname === '127.0.0.1')
        return route.continue(); blocked.push(u.hostname); return route.abort(); }); await c.addCookies([{ name: 'tl_platform_session', value: fixture.users[name].token, url }]); return c; }
    async function dismissConsent(page) { const button=page.getByRole('button',{name:'Reject optional',exact:true}); try { await button.waitFor({state:'visible',timeout:15000}); } catch { return; } await button.click(); }
    const owner = await context('owner');
    const p = await owner.newPage();
    p.on('pageerror', e => errors.push(e.message));
    p.on('dialog', d => d.accept());
    async function click(label) { refreshSyntheticOwner(); await p.getByRole('button', { name: label, exact: true }).click(); }
    async function save(publish = false) { await click(publish ? 'Save and publish' : 'Save draft and close'); await expect(p.getByRole('status').filter({ hasText: publish ? 'Plan published' : 'Draft saved' })).toBeVisible({ timeout: 20000 }); await expect(p.getByLabel('Plan name', { exact: true })).toHaveCount(0); }
    async function configuration() { return p.locator('form').evaluate(form => [...form.querySelectorAll('input,textarea,select')]
        .filter(el => !(el.tagName === 'TEXTAREA' && el.getAttribute('aria-hidden') === 'true'))
        .map(el => ({ label: el.closest('.MuiFormControl-root')?.querySelector('label')?.textContent || el.closest('label')?.textContent || '',
            type: el.type, value: el.value, checked: el.type === 'checkbox' ? el.checked : undefined }))); }
    const levels = p.locator('div').filter({ has: p.getByRole('checkbox', { name: 'Levels Generator generations', exact: true }) }).filter({ has: p.getByLabel('Allowance', { exact: true }) }).last();
    let publicPage;
    refreshSyntheticOwner();
    await p.goto(admin);
    await dismissConsent(p);
    if (process.env.MEMBERSHIP_QA_PHASE === 'layout') {
      for (const mode of ['light','dark']) {
        withDb(db => db.prepare('UPDATE platform_user_preferences SET appearance_mode=?,updated_at_utc=? WHERE user_id=?')
          .run(mode,new Date().toISOString(),fixture.users.owner.userId));
        await p.reload();
        await p.getByText('QA Private Q',{exact:true}).first().locator('..').getByRole('button',{name:'Edit',exact:true}).click();
        await expect(p.getByLabel('Plan name',{exact:true})).toHaveValue('QA Private Q');
        await expect(levels.getByLabel('Allowance',{exact:true})).toHaveValue('12');
        await expect(p.getByLabel('Trial name',{exact:true})).toHaveValue('QA Trial T');
        await expect(p.locator('main').locator('..')).toHaveCSS('background-color',mode === 'dark' ? 'rgb(14, 21, 32)' : 'rgb(245, 247, 251)');
        for (const width of [1440,390]) {
          await p.setViewportSize({width,height:width===390?844:1000});
          await p.waitForTimeout(500);
          await expect.poll(()=>p.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
          await p.screenshot({path:path.join(evidence,`populated-${mode}-${width}.png`),fullPage:true});
          pass(`populated ${mode} editor at ${width}px: readback and no horizontal overflow`);
        }
        await click('Cancel');
      }
      fs.writeFileSync(path.join(evidence,'browser-result.json'),JSON.stringify({phase:'layout',steps,errors},null,2));
      assert.equal(errors.length,0);
      await browser.close(); return;
    }
    if (!['access','members','bulk','archive'].includes(process.env.MEMBERSHIP_QA_PHASE)) {
    await expect(p.getByText('No plans yet. Select New plan to create your first plan.')).toBeVisible();
    await click('New plan');
    await expect(p.getByLabel('Plan name', { exact: true })).toHaveValue('');
    await p.getByLabel('Internal note', { exact: true }).fill('Retain input on validation');
    await click('Save and publish');
    await expect(p.getByText('Enter a plan name.', { exact: true })).toBeVisible();
    await expect(p.getByLabel('Internal note', { exact: true })).toHaveValue('Retain input on validation');
    await p.getByLabel('Plan name', { exact: true }).focus();
    await p.keyboard.type('Keyboard input');
    await expect(p.getByLabel('Plan name', { exact: true })).toHaveValue('Keyboard input');
    pass('browser validation preserves input; keyboard entry');
    await p.getByLabel('Plan name', { exact: true }).fill('QA Draft D');
    await p.getByLabel('Internal note', { exact: true }).fill('Synthetic unfinished note');
    await save();
    await click('Edit');
    await expect(p.getByLabel('Internal note', { exact: true })).toHaveValue('Synthetic unfinished note');
    await click('Cancel');
    await click('Delete draft');
    await expect(p.getByText('No plans yet. Select New plan to create your first plan.')).toBeVisible();
    pass('case1 empty/new/draft/reopen/delete');
    await p.goto(url + '/admin/journal/memberships?section=Private%20links');
    await p.getByLabel('Link name').fill('QA Secret S');
    await click('Create private link');
    const secretLink = await p.getByRole('link').filter({ hasText: '/plans/invite/' }).getAttribute('href');
    assert(secretLink);
    await p.goto(admin);
    await click('New plan');
    await p.getByLabel('Plan name', { exact: true }).fill('QA Public P');
    await p.getByRole('combobox', { name: 'Visibility', exact: true }).click();
    await p.getByRole('option', { name: 'Public plans page', exact: true }).click();
    await p.getByLabel('Plan description', { exact: true }).fill('Synthetic public plan');
    await p.getByLabel('Internal note', { exact: true }).fill('QA INTERNAL NEVER PUBLIC');
    for (const label of ['Dashboard', 'Dashboard news', 'Trade Analyzer analyses', 'Watchlist', 'Levels Generator generations', 'Private Watchlist', 'Private Watchlist ticker additions', 'Private Watchlist generations', 'Private Watchlist generation budget', 'News visibility delay', 'News notification delay']) {
        const box = p.getByRole('checkbox', { name: label, exact: true });
        if (await box.count())
            await box.check();
    }
    await levels.getByLabel('Allowance', { exact: true }).fill('12');
    await levels.getByLabel('Reset every (days)', { exact: true }).fill('30');
    await levels.locator('summary').click();
    await levels.getByLabel('Brief description', { exact: true }).fill('QA brief levels');
    await levels.getByLabel('Expandable details', { exact: true }).fill('QA expanded levels');
    for (const [label, input, value] of [['Trade Analyzer analyses', 'Allowance', '12'], ['Private Watchlist ticker additions', 'Allowance', '10'], ['Private Watchlist generations', 'Allowance', '10'], ['Private Watchlist generation budget', 'Generation budget (USD)', '0.25'], ['News visibility delay', 'Delay', '2'], ['News notification delay', 'Delay', '3']]) {
        const card = p.locator('div').filter({ has: p.getByRole('checkbox', { name: label, exact: true }) }).filter({ has: p.getByLabel(input, { exact: true }) }).last();
        await card.getByLabel(input, { exact: true }).fill(value);
        if (label.startsWith('Private Watchlist') && input === 'Allowance') {
            await card.getByRole('combobox', { name: 'Allowance period', exact: true }).click();
            await p.getByRole('option', { name: 'Custom days', exact: true }).click();
            await card.getByLabel('Days per period', { exact: true }).fill('30');
        }
    }
    await click('Add price or access option');
    await p.getByLabel('Access option name', { exact: true }).fill('QA Free access');
    await click('Add trial');
    await p.getByLabel('Trial name', { exact: true }).fill('QA Trial T');
    await p.getByLabel('Trial duration (days)', { exact: true }).fill('3');
    await click('Add Discord access');
    await p.getByRole('checkbox', { name: 'Discord access enabled', exact: true }).uncheck();
    await p.getByText('Advanced server and role identifiers', { exact: true }).click();
    await p.getByLabel('Server ID', { exact: true }).fill('900000000000000009');
    await p.getByLabel('Role IDs', { exact: true }).fill('900000000000000010, 900000000000000011');
    const enteredConfiguration = await configuration();
    await save();
    await click('Edit');
    assert.deepEqual(await configuration(), enteredConfiguration, 'Every entered field must survive draft reopen');
    await expect(p.getByLabel('Plan name', { exact: true })).toHaveValue('QA Public P');
    await expect(p.getByLabel('Trial duration (days)', { exact: true })).toHaveValue('3');
    await expect(levels.getByLabel('Allowance', { exact: true })).toHaveValue('12');
    publicPage = await owner.newPage();
    await publicPage.goto(url + '/plans');
    await expect(publicPage.getByRole('heading', { name: 'QA Public P', exact: true })).toHaveCount(0);
    pass('case2 draft readback/public exclusion');
    await save(true);
    await publicPage.reload();
    await expect(publicPage.getByRole('heading', { name: 'QA Public P', exact: true })).toBeVisible();
    await expect(publicPage.getByText('QA INTERNAL NEVER PUBLIC')).toHaveCount(0);
    await expect(publicPage.getByText('QA brief levels')).toBeVisible();
    await publicPage.getByLabel('More details about Levels Generator generations').click();
    await expect(publicPage.getByText('QA expanded levels')).toBeVisible();
    pass('case3 current-form publication/public card');
    await click('Edit');
    await expect(p.getByLabel('Trial name', { exact: true })).toHaveValue('QA Trial T');
    await expect(p.getByRole('checkbox', { name: 'Discord access enabled', exact: true })).not.toBeChecked();
    await p.getByText('Advanced server and role identifiers', { exact: true }).click();
    await expect(p.getByLabel('Server ID', { exact: true })).toHaveValue('900000000000000009');
    await expect(p.locator('main').locator('..')).toHaveCSS('background-color', 'rgb(14, 21, 32)');
    await expect(p.getByRole('heading', {name:'Details',exact:true})).toHaveCSS('color','rgb(255, 255, 255)');
    await p.screenshot({ path: path.join(evidence, 'editor-navy-dark.png'), fullPage: true });
    withDb(db => db.prepare("UPDATE platform_user_preferences SET appearance_mode='light',updated_at_utc=? WHERE user_id=?").run(new Date().toISOString(),fixture.users.owner.userId));
    await p.reload();
    await click('Edit');
    await expect(p.locator('main').locator('..')).toHaveCSS('background-color', 'rgb(245, 247, 251)');
    await expect(levels.getByLabel('Allowance', { exact: true })).toHaveValue('12');
    pass('saved Navy Dark/Light appearance; editor readback');
    await p.screenshot({ path: path.join(evidence, 'editor-desktop.png'), fullPage: true });
    await p.setViewportSize({ width: 390, height: 844 });
    await p.waitForTimeout(500); // Allow responsive TextareaAutosize measurements to settle.
    const layout = await p.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth,
        overflowing: [...document.querySelectorAll('body *')].map(el => ({ tag: el.tagName, text: el.textContent?.slice(0, 100),
            left: el.getBoundingClientRect().left, right: el.getBoundingClientRect().right,
            width: el.getBoundingClientRect().width, className: String(el.className) }))
            .filter(el => el.width > 0 && el.right > innerWidth + 1) }));
    fs.writeFileSync(path.join(evidence, 'mobile-layout.json'), JSON.stringify(layout, null, 2));
    if (layout.scrollWidth > layout.width) steps.push({step:'mobile horizontal overflow',status:'FAIL'});
    else pass('mobile no horizontal overflow');
    await p.screenshot({ path: path.join(evidence, 'editor-mobile.png'), fullPage: true });
    withDb(db => db.prepare("UPDATE platform_user_preferences SET appearance_mode='dark',updated_at_utc=? WHERE user_id=?").run(new Date().toISOString(),fixture.users.owner.userId));
    await p.reload(); await click('Edit');
    await expect(p.getByLabel('Plan name',{exact:true})).toHaveValue('QA Public P');
    await expect(levels.getByLabel('Allowance',{exact:true})).toHaveValue('12');
    await expect(p.locator('main').locator('..')).toHaveCSS('background-color','rgb(14, 21, 32)');
    await expect.poll(()=>p.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    await p.screenshot({path:path.join(evidence,'editor-mobile-navy-dark.png'),fullPage:true});
    pass('Navy Dark mobile layout');
    await click('Cancel');
    await p.setViewportSize({ width: 1440, height: 1000 });
    await click('Duplicate');
    await expect(levels.getByLabel('Allowance', { exact: true })).toHaveValue('12');
    await p.getByLabel('Plan name', { exact: true }).fill('QA Private Q');
    await p.getByRole('combobox', { name: 'Visibility', exact: true }).click();
    await p.getByRole('option', { name: 'Private', exact: true }).click();
    await p.getByRole('checkbox', { name: 'Display only — show the plan without enabling purchases', exact: true }).check();
    await p.getByRole('checkbox', { name: 'QA Secret S', exact: true }).check();
    await save(true);
    await publicPage.reload();
    await expect(publicPage.getByRole('heading', { name: 'QA Private Q', exact: true })).toHaveCount(0);
    await publicPage.goto(new URL(secretLink,url).href);
    await expect(publicPage.getByRole('heading', { name: 'QA Private Q', exact: true })).toBeVisible();
    await expect(publicPage.getByRole('button', { name: 'Get access', exact: true })).toHaveCount(0);
    await expect(publicPage.getByRole('button', { name: 'Start trial', exact: true })).toHaveCount(0);
    assert((await publicPage.locator('meta[name=robots]').getAttribute('content')).includes('noindex'));
    const invalid = await publicPage.goto(url + '/plans/invite/invalid-synthetic-secret');
    assert.equal(invalid.status(), 404);
    pass('case4 duplicate/private/no-checkout/noindex/invalid-secret');
    await publicPage.close();
    if (process.env.MEMBERSHIP_QA_PHASE === 'editor') {
        assert.equal(steps.filter(step => step.status === 'FAIL').length, 0, 'Unresolved editor findings');
        await browser.close(); return;
    }
    }
    if (!['members','bulk','archive'].includes(process.env.MEMBERSHIP_QA_PHASE)) {
    const concurrent = await owner.newPage();
    await p.goto(admin);
    await concurrent.goto(admin);
    await p.getByText('QA Public P', { exact: true }).first().locator('..').getByRole('button', { name: 'Edit', exact: true }).click();
    await concurrent.getByText('QA Public P', { exact: true }).first().locator('..').getByRole('button', { name: 'Edit', exact: true }).click();
    await p.getByLabel('Plan description', { exact: true }).fill('Synthetic public plan revised');
    await save(true);
    await concurrent.getByLabel('Plan description', { exact: true }).fill('Retain stale input');
    await concurrent.getByRole('button', { name: 'Save draft and close', exact: true }).click();
    await expect(concurrent.getByRole('alert').filter({ hasText: /changed|Another/ })).toBeVisible();
    await expect(concurrent.getByLabel('Plan description', { exact: true })).toHaveValue('Retain stale input');
    await concurrent.close();
    pass('case5 browser stale rejection/input preserved (retry receipts also offline verified)');
    await p.getByText('QA Public P', { exact: true }).first().locator('..').getByRole('button', { name: 'Edit', exact: true }).click();
    await p.getByLabel('Plan description', { exact: true }).fill('Synthetic retry publication');
    const versionsBeforeRetry = withDb(db=>db.prepare('SELECT count(*) n FROM platform_membership_plan_versions').get().n);
    await p.evaluate(() => {
        const original = window.fetch;
        window.fetch = async function(input, options) {
            const response = await original.call(this, input, options);
            if (options?.method === 'POST' && String(input).includes('/admin/journal/memberships')) {
                window.fetch = original;
                window.__membershipQaDroppedResponse = true;
                throw new Error('Synthetic response loss after server commit');
            }
            return response;
        };
    });
    await click('Save and publish');
    await expect(p.getByRole('alert').filter({hasText:"We couldn't confirm the save"})).toBeVisible();
    await expect(p.getByLabel('Plan description', { exact: true })).toHaveValue('Synthetic retry publication');
    await save(true);
    assert(await p.evaluate(() => window.__membershipQaDroppedResponse));
    withDb(db=>assert.equal(db.prepare('SELECT count(*) n FROM platform_membership_plan_versions').get().n,versionsBeforeRetry+1));
    pass('browser lost-response retry preserves input and creates exactly one version');
    }
    const memberA = await context('A'), memberB = await context('B');
    for (const c of [memberA, memberB]) {
        const m = await c.newPage();
        const response = await m.goto(admin);
        assert(response.status() < 500, 'Expected admin denial must not produce a server error');
        if (!new URL(m.url()).pathname.startsWith('/api/auth/discord/login'))
          await expect(m.getByRole('heading', {name:'Journal Administration is locked',exact:true})).toBeVisible();
        await expect(m.getByRole('button', { name: 'New plan', exact: true })).toHaveCount(0);
        await m.close();
    }
    pass('member A/B admin denial');
    if (process.env.MEMBERSHIP_QA_PHASE !== 'archive') {
    const a = await memberA.newPage();
    if (!withDb(db=>db.prepare("SELECT 1 FROM platform_membership_entitlements WHERE user_id=? AND source_type='free_plan' AND status='active'").get(fixture.users.A.userId))) {
        await a.goto(url + '/plans');
        await dismissConsent(a);
        await a.getByRole('button', { name: 'Get access', exact: true }).click();
        await a.waitForURL('**/account/membership');
    } else { await a.goto(url + '/account/membership'); await dismissConsent(a); }
    await expect(a.getByText(/^QA Public P ·/).first()).toBeVisible();
    if (process.env.MEMBERSHIP_QA_PHASE !== 'bulk') {
    const b = await memberB.newPage();
    await b.goto(url + '/plans');
    await dismissConsent(b);
    await b.getByRole('button', { name: 'Start trial', exact: true }).click();
    await b.waitForURL('**/account/membership');
    await expect(b.getByText(/^QA Public P ·/).first()).toBeVisible();
    await b.close();
    pass('case6 browser free/trial enrollment without Discord membership');
    withDb(db => {
        const repo = new PlatformMembershipRepository(db);
        const trial = db.prepare("SELECT ends_at_utc FROM platform_membership_entitlements WHERE user_id=? AND source_type='trial'").get(fixture.users.B.userId);
        assert(trial?.ends_at_utc, 'end-access trial must expire');
        assert.equal(repo.readEffectiveAccess(fixture.users.B.userId, trial.ends_at_utc).sources.length, 0);
        assert.equal(db.prepare('SELECT count(*) n FROM platform_membership_provider_subscriptions WHERE user_id=?').get(fixture.users.B.userId).n, 0);
        const q = db.prepare("SELECT v.plan_version_id FROM platform_membership_plan_versions v JOIN platform_membership_plans p USING(plan_id) WHERE p.name='QA Private Q' AND v.lifecycle_state='published'").get();
        repo.grantEntitlement({ actorUserId: fixture.users.owner.userId, userId: fixture.users.A.userId,
            planVersionId: q.plan_version_id, sourceType: 'owner_grant', sourceRef: 'synthetic-independent-Q',
            startsAtUtc: new Date().toISOString(), endsAtUtc: null, reason: 'Synthetic independent lifetime grant' });
    });
    pass('trial exact expiry/no subscription; independent lifetime grant seeded');
    withDb(db => { const at = new Date().toISOString(); for (const key of ['levels.generations', 'trade_analyzer.analyses', 'watchlist.access', 'watchlist.ticker_details', 'watchlist.trade_analysis', 'private_watchlist.access', 'private_watchlist.analysis', 'private_watchlist.indicators', 'private_watchlist.ticker_additions', 'private_watchlist.generations', 'private_watchlist.cost_microusd', 'news.visibility_delay_seconds', 'news.notification_delay_seconds', 'notifications.chart_update', 'notifications.market_news'])
        db.prepare('INSERT OR REPLACE INTO platform_membership_feature_policies VALUES (?,?,?,?)').run(key, 'enforced', fixture.users.owner.userId, at); const A = fixture.users.A.userId, B = fixture.users.B.userId; assert(evaluateMembershipFeature(db, A, 'watchlist.access').allowed); assert(!evaluateMembershipFeature(db, A, 'watchlist.ticker_details').allowed); assert(!evaluateMembershipFeature(db, A, 'watchlist.trade_analysis').allowed); assert.equal(readMembershipNewsDelaySeconds(db, A, 'news.visibility_delay_seconds'), 120); for (let i = 0; i < 3; i++)
        db.prepare('INSERT INTO platform_stock_levels_usage(user_id,symbol,requested_at_ms,new_york_date) VALUES (?,?,?,?)').run(A, 'QA', Date.now(), '2026-10-13'); assert.equal(readGenerationAllowance(db, A, 'levels.generations', new Date()).remaining, 9); assert.equal(readGenerationAllowance(db, B, 'levels.generations', new Date()).remaining, 12); const privateRepo = new PrivateWatchlistRepository(db); for (let i = 0; i < 10; i++)
        privateRepo.add(A, 'QA' + i, crypto.randomUUID(), at); assert.throws(() => privateRepo.add(A, 'QAEXTRA', crypto.randomUUID(), at)); assert.equal(privateRepo.list(A, at).length, 10); assert.equal(privateRepo.list(B, at).length, 0); assert.throws(() => privateRepo.assertGenerationAllowed(A, 'QA0', { analysis: true, indicators: false, levels: false }, at)); assert.throws(() => privateRepo.assertGenerationAllowed(A, 'QA0', { analysis: false, indicators: true, levels: false }, at)); db.prepare("INSERT INTO platform_private_watchlist_operations(user_id,request_id,symbol,operation,state,request_hash,maximum_cost_microusd,actual_cost_microusd,created_at_utc,updated_at_utc) VALUES (?,?,?,'generation','completed',?,150000,150000,?,?)").run(A, crypto.randomUUID(), 'QA0', 'a'.repeat(64), at, at); assert.equal(privateWatchlistRemaining(db, A, 'cost_microusd', at), 100000); assert.equal(privateWatchlistRemaining(db, A, 'generations', at), 9); });
    pass('case7 synthetic usage/Levels/private boundaries/news delay/cross-user server checks');
    }
    await p.goto(admin);
    const before = withDb(db => db.prepare('SELECT * FROM platform_membership_entitlements ORDER BY entitlement_id').all());
    withDb(db => {
        assert.equal(readMembershipNewsDelaySeconds(db, fixture.users.A.userId, 'news.notification_delay_seconds'), 180);
        db.exec('SAVEPOINT synthetic_quota_boundary');
        try {
            for (let i = 0; i < 9; i++) db.prepare('INSERT INTO platform_stock_levels_usage(user_id,symbol,requested_at_ms,new_york_date) VALUES (?,?,?,?)')
                .run(fixture.users.A.userId, 'QABOUND', Date.now(), '2026-10-13');
            assert.equal(readGenerationAllowance(db, fixture.users.A.userId, 'levels.generations', new Date()).remaining, 0);
            assert.equal(readGenerationAllowance(db, fixture.users.B.userId, 'levels.generations', new Date()).remaining, 12);
        } finally { db.exec('ROLLBACK TO synthetic_quota_boundary; RELEASE synthetic_quota_boundary'); }
    });
    pass('Levels exhausted allowance remains isolated; notification news delay');
    for (const endpoint of ['/api/live-watchlist/symbols/QA/analysis-history', '/api/live-watchlist/symbols/QA/indicators'])
        assert.equal((await a.request.get(url + endpoint)).status(), 403);
    pass('server HTTP ticker/analysis gates');
    const defaults = await memberB.newPage();
    withDb(db => assert.equal(db.prepare('SELECT count(*) n FROM platform_notification_delivery_preferences WHERE user_id=?').get(fixture.users.B.userId).n, 0));
    await defaults.goto(url + '/account/preferences');
    await expect(defaults.getByRole('checkbox',{name:'Chart updates',exact:true}).first()).toBeChecked();
    await expect(defaults.getByRole('checkbox',{name:'The Week Ahead',exact:true}).first()).toBeChecked();
    await defaults.close();
    pass('eligible member with no preference rows sees defaults ON');
    await a.goto(url + '/account/preferences');
    if (process.env.MEMBERSHIP_QA_PHASE !== 'bulk')
      await expect(a.getByRole('checkbox', { name: 'Chart updates', exact: true }).first()).toBeChecked();
    await a.getByRole('checkbox', { name: 'Chart updates', exact: true }).first().uncheck();
    const unsavedEmailChoice = a.getByRole('checkbox', {name:'The Week Ahead',exact:true}).nth(1);
    await unsavedEmailChoice.uncheck();
    await a.getByRole('button', { name: 'Save Preferences', exact: true }).click();
    await expect(a.getByText('Discord notification preferences saved.')).toBeVisible();
    await expect(unsavedEmailChoice).not.toBeChecked();
    pass('saving Discord preferences retains success feedback and unsaved email choice');
    await p.getByText('QA Public P', { exact: true }).first().locator('..').getByRole('button', { name: 'Edit', exact: true }).click();
    await levels.getByLabel('Allowance', { exact: true }).fill('25');
    await levels.getByLabel('Reset every (days)', { exact: true }).fill('7');
    await p.getByRole('checkbox', { name: 'Ticker details', exact: true }).check();
    await p.getByRole('checkbox', { name: 'Market halts', exact: true }).check();
    await save(true);
    withDb(db => { const current = db.prepare('SELECT * FROM platform_membership_entitlements ORDER BY entitlement_id').all(); assert.deepEqual(current, before); assert.equal(readGenerationAllowance(db, fixture.users.A.userId, 'levels.generations', new Date()).remaining, 9); });
    withDb(db=>db.prepare('INSERT OR REPLACE INTO platform_membership_feature_policies VALUES (?,?,?,?)').run('notifications.market_halt','enforced',fixture.users.owner.userId,new Date().toISOString()));
    await a.reload();
    await expect(a.getByRole('link',{name:'Halt notifications — included with QA Public P. View plans',exact:true})).toHaveAttribute('href','/plans?feature=notifications.market_halt');
    pass('locked notification names qualifying public plan and upgrade link');
    const freshEnrollment = await memberB.newPage();
    await freshEnrollment.goto(url + '/plans');
    await dismissConsent(freshEnrollment);
    await freshEnrollment.getByRole('button', {name:'Get access',exact:true}).click();
    await freshEnrollment.waitForURL('**/account/membership');
    withDb(db => {
        assert.equal(readGenerationAllowance(db, fixture.users.B.userId, 'levels.generations', new Date()).remaining, 25);
        assert(evaluateMembershipFeature(db, fixture.users.B.userId, 'watchlist.ticker_details').allowed);
        const trial = before.find(grant => grant.user_id === fixture.users.B.userId && grant.source_type === 'trial');
        assert.deepEqual(db.prepare('SELECT * FROM platform_membership_entitlements WHERE entitlement_id=?').get(trial.entitlement_id), trial);
        const later = new PlatformMembershipRepository(db).readEffectiveAccess(fixture.users.B.userId, trial.ends_at_utc);
        assert(later.sources.some(source => source.source === 'free_plan'));
        assert(!later.sources.some(source => source.source === 'trial'));
    });
    await freshEnrollment.close();
    pass('new enrollment receives revised terms while existing trial retains prior terms');
    const beforeApply = withDb(db => db.prepare('SELECT * FROM platform_membership_entitlements ORDER BY entitlement_id').all());
    await p.getByText('QA Public P', { exact: true }).first().locator('..').getByRole('button', { name: 'Edit', exact: true }).click();
    await p.getByRole('checkbox', { name: /Apply feature\/access changes to existing members/ }).check();
    await save(true);
    withDb(db => { const current = db.prepare('SELECT * FROM platform_membership_entitlements ORDER BY entitlement_id').all(); for (let i = 0; i < current.length; i++) {
        if (beforeApply[i].source_ref === 'synthetic-independent-Q') assert.deepEqual(current[i], beforeApply[i]);
        for (const key of ['entitlement_id', 'source_type', 'source_ref', 'starts_at_utc', 'ends_at_utc'])
            assert.equal(current[i][key], beforeApply[i][key]);
    } assert.equal(readGenerationAllowance(db, fixture.users.A.userId, 'levels.generations', new Date()).remaining, 22); assert.equal(db.prepare('SELECT count(*) n FROM platform_stock_levels_usage WHERE user_id=?').get(fixture.users.A.userId).n, 3); });
    pass('case8 browser unchecked/checked bulk access preserves source/expiry/usage');
    await a.goto(url + '/account/preferences');
    const chart = a.getByRole('checkbox', { name: 'Chart updates', exact: true }).first();
    await expect(chart).not.toBeChecked();
    pass('explicit notification OFF survives bulk plan upgrade');
    await a.getByRole('button', { name: 'Save Preferences', exact: true }).click();
    await expect(a.getByText('Discord notification preferences saved.')).toBeVisible();
    await a.reload();
    await expect(a.getByRole('checkbox', { name: 'Chart updates', exact: true }).first()).not.toBeChecked();
    await expect(a.getByRole('checkbox', { name: 'The Week Ahead', exact: true }).first()).toBeChecked();
    await a.getByRole('checkbox', {name:'The Week Ahead',exact:true}).first().uncheck();
    await a.getByRole('button', { name: 'Save Preferences', exact: true }).click();
    await expect(a.getByText('Discord notification preferences saved.')).toBeVisible();
    await a.reload();
    await expect(a.getByRole('checkbox', { name: 'Chart updates', exact: true }).first()).not.toBeChecked();
    await expect(a.getByRole('checkbox', { name: 'The Week Ahead', exact: true }).first()).not.toBeChecked();
    await expect(a.getByRole('checkbox', {name:'Broker imports',exact:true}).first()).toBeChecked();
    pass('case9 default ON/explicit OFF/different-category save persistence');
    }
    const trialRetry = await memberB.newPage();
    await trialRetry.goto(url + '/plans');
    await dismissConsent(trialRetry);
    await trialRetry.getByRole('button', { name: 'Start trial', exact: true }).click();
    await expect(trialRetry.getByText('You have already enrolled in this trial.')).toBeVisible();
    await trialRetry.close();
    pass('trial repeat blocked after republication');
    await p.goto(admin);
    const grants = withDb(db => db.prepare('SELECT * FROM platform_membership_entitlements ORDER BY entitlement_id').all());
    await p.getByText('QA Public P', { exact: true }).first().locator('..').getByRole('button', { name: 'Archive', exact: true }).click();
    await expect(p.getByText('Plan archived. New signups stopped; existing access is unchanged.')).toBeVisible();
    publicPage = await owner.newPage();
    await publicPage.goto(url + '/plans');
    await expect(publicPage.getByRole('heading', { name: 'QA Public P', exact: true })).toHaveCount(0);
    withDb(db => assert.deepEqual(db.prepare('SELECT * FROM platform_membership_entitlements ORDER BY entitlement_id').all(), grants));
    pass('case10 archive/public removal/grants preserved');
    fs.writeFileSync(path.join(evidence, 'browser-result.json'), JSON.stringify({ errors, blocked, steps,
        phase: process.env.MEMBERSHIP_QA_PHASE,
        coverage: 'Only the recorded steps are covered. Consult the progress record for the complete remaining matrix.' }, null, 2));
    assert.equal(errors.length, 0, JSON.stringify(errors));
    assert.equal(steps.filter(step => step.status === 'FAIL').length, 0, 'Recorded browser findings remain unresolved');
    await browser.close();
})().catch(async (e) => {
    let message = String(e?.message || e);
    for (const user of Object.values(fixture.users)) message = message.replaceAll(user.token,'[synthetic session redacted]');
    message = message.replace(/\/plans\/invite\/[^\s?"']+/g,'/plans/invite/[synthetic secret redacted]');
    console.error(message);
    for (const [i, context] of (launched?.contexts() || []).entries()) {
        const page = context.pages().at(-1);
        if (page) await page.screenshot({path:path.join(evidence,`failure-context-${i}.png`)}).catch(()=>{});
    }
    fs.writeFileSync(path.join(evidence,'failure.json'),JSON.stringify({error:message,steps},null,2));
    await launched?.close(); process.exitCode = 1;
});
