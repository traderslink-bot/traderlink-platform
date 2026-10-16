// Actual create action/feedback adapter; request/database acquisition isolated.
const assert = require('node:assert/strict');
const { createLessonActionHarness } = require('./coaching-lesson-action-acceptance.cjs');
(async () => {
    const inputs = [];
    let failure = null;
    const actions = createLessonActionHarness({ database: { prepare: () => ({ get: () => ({ community_id: 'synthetic-community' }) }) }, actor: { userId: 'synthetic-coach' }, Service: class {
            createTeaching(input) { if (failure)
                throw failure; inputs.push(input); }
        }, atUtc: '2026-10-16T14:00:00.000Z' });
    const form = () => { const f = new FormData(); for (const [k, v] of Object.entries({ communitySlug: 'first-room', title: 'QA only lesson', teachingType: 'lesson', audienceMode: 'all_students', body: 'Unchanged synthetic draft' }))
        f.set(k, v); return f; };
    for (const [intent, publish] of [['', false], ['on', true]]) {
        const f = form();
        f.set('publish', intent);
        await assert.rejects(actions.create({ error: '' }, f), e => e.digest?.startsWith('NEXT_REDIRECT;'));
        assert.equal(inputs.at(-1).publish, publish);
        assert.equal(inputs.at(-1).body, 'Unchanged synthetic draft');
        assert.equal(inputs.at(-1).actor.userId, 'synthetic-coach');
    }
    failure = Error('PRIVATE PROVIDER SENTINEL');
    const rejected = form();
    const result = await actions.create({ error: '' }, rejected);
    assert.match(result.error, /entries are still here/);
    assert(!result.error.includes('SENTINEL'));
    assert.equal(rejected.get('body'), 'Unchanged synthetic draft');
    assert.equal(inputs.length, 2);
    failure = Object.assign(Error('sign in'), { digest: 'NEXT_REDIRECT;replace;/login;307;' });
    await assert.rejects(actions.create({ error: '' }, form()), e => e === failure);
    console.log('PASS: real lesson create adapter preserves draft/publish intent, retains supplied values on failure, hides internal details and preserves redirect control flow. No real provider or hosted database.');
})().catch(e => { console.error(e); process.exitCode = 1; });
