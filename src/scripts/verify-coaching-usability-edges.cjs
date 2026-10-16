// Regression checks for the second usability QA findings; isolated actions only.
// Run: COACHING_UX_EDGE_QA=1 node src/scripts/verify-coaching-usability-browser.cjs
module.exports = async function ({page, go, capture, discard, assert}) {
    const observations = [];
    const record = (id, status, evidence) => observations.push({id, status, evidence});
    const title = () => page.getByRole('textbox', {name:'Title', exact:true}).first();
    const image = () => page.locator('input[type="file"][name="image"]');
    const file = name => ({name, mimeType:'image/png', buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64')});
    const settle = async (mode = 'error') => {
        await page.evaluate(mode => {window.actionMode=mode;window.pendingActions.splice(0).forEach(resolve=>resolve());}, mode);
    };

    await go('setup');
    await page.getByRole('button', {name:'Performance review', exact:true}).click();
    await page.getByRole('button', {name:'Edit', exact:true}).first().click();
    await page.getByRole('dialog').waitFor();
    await page.getByRole('button', {name:'Keep editing', exact:true}).click();
    await page.getByRole('dialog').waitFor({state:'hidden'});
    assert(await page.getByRole('button', {name:'Publish plan',exact:true}).isVisible());
    record('service-only-draft', 'PASS', 'Adding a service with no title change triggers the discard guard. Keep editing retains the new plan.');

    await go('teaching');
    await page.getByRole('combobox', {name:'Audience',exact:true}).click();
    await page.getByRole('option', {name:'Selected students',exact:true}).click();
    await page.getByRole('checkbox', {name:'Alex Rivers',exact:true}).check();
    await page.getByRole('button', {name:'Reuse',exact:true}).click();
    await page.getByRole('dialog').waitFor();
    await page.keyboard.press('Escape');
    await page.getByRole('dialog').waitFor({state:'hidden'});
    assert(await page.getByRole('checkbox', {name:'Alex Rivers',exact:true}).isChecked());
    record('audience-only-draft', 'PASS', 'Audience/recipient-only edits trigger the guard; Escape preserves the selected student.');

    await go('teaching');
    await page.getByRole('combobox',{name:'Audience',exact:true}).click();
    await page.getByRole('option',{name:'Selected students',exact:true}).click();
    await page.getByRole('checkbox',{name:'Alex Rivers',exact:true}).check();
    await title().fill('QA first submitted title');
    await page.evaluate(() => window.actionMode='deferred');
    await page.getByRole('button', {name:'Publish lesson',exact:true}).click();
    await page.waitForFunction(() => window.pendingActions?.length === 1);
    assert(await page.getByRole('button', {name:'Save draft',exact:true}).isDisabled());
    assert(await page.getByRole('button', {name:'Publishing lesson…',exact:true}).isDisabled());
    assert(await title().isDisabled());
    assert(await page.getByRole('textbox',{name:'Content',exact:true}).first().isDisabled());
    assert(await page.getByRole('combobox',{name:'Audience',exact:true}).isDisabled());
    assert(await page.getByRole('checkbox',{name:'Alex Rivers',exact:true}).isDisabled());
    assert.equal(await page.evaluate(() => window.actionCalls[0].data.title),'QA first submitted title');
    assert.equal(await page.evaluate(() => window.actionCalls[0].data.publish),'on');
    assert(await page.evaluate(() => Boolean(window.actionCalls[0].data.relationshipId)));
    record('lesson-inflight-edit', 'PASS', 'Title/content/audience/recipient inputs lock during publication; the submitted payload still includes the original title, recipient and publish flag.');
    await capture('pending-lesson-locked');
    assert(await page.getByRole('button', {name:'Reuse',exact:true}).isDisabled());
    await page.getByRole('button', {name:'Reuse',exact:true}).evaluate(button=>button.click());
    assert.equal(await page.getByRole('dialog').count(),0);
    assert.equal(await page.evaluate(() => window.pendingActions.length),1);
    await settle();
    await page.getByRole('alert').filter({hasText:'QA rejected save'}).waitFor();
    assert(await title().isEnabled());
    assert.equal(await title().inputValue(),'QA first submitted title');
    assert(await page.getByRole('checkbox',{name:'Alex Rivers',exact:true}).isChecked());
    assert(await page.getByRole('button',{name:'Reuse',exact:true}).isEnabled());
    record('lesson-inflight-reuse', 'PASS', 'Reuse cannot replace a pending composer or start another action. Rejection restores editing and Reuse with the entered title and audience retained.');
    await page.evaluate(()=>window.actionMode='deferred');
    await page.getByRole('button',{name:'Save draft',exact:true}).click();
    await page.waitForFunction(()=>window.actionCalls.length===2 && window.pendingActions.length===1);
    assert(await page.getByRole('button',{name:'Saving draft…',exact:true}).isDisabled());
    assert(await title().isDisabled());
    assert(await page.getByRole('button',{name:'Reuse',exact:true}).isDisabled());
    await settle();
    await page.getByRole('button',{name:'Save draft',exact:true}).waitFor();
    assert.equal(await page.evaluate(()=>window.actionCalls[1].data.publish),'');
    await page.getByRole('button',{name:'Reuse',exact:true}).click();
    await discard();
    assert.equal(await title().inputValue(),'Building an opening-range plan');

    await go('student');
    await image().setInputFiles(file('QA first submitted.png'));
    await page.evaluate(() => window.actionMode='deferred');
    await page.getByRole('button', {name:'Send image',exact:true}).click();
    await page.waitForFunction(() => window.pendingActions?.length === 1);
    assert(await page.getByRole('button', {name:'Sending image…',exact:true}).isDisabled());
    const sentFile = await page.evaluate(() => window.actionCalls[0].data.image.name);
    assert(await image().isDisabled());
    assert(await page.getByRole('button',{name:'Select chart',exact:true}).isDisabled());
    assert(await page.getByRole('button',{name:'Remove selected image',exact:true}).isDisabled());
    await page.getByRole('button',{name:'Remove selected image',exact:true}).evaluate(button=>button.click());
    assert(await page.getByText('QA first submitted.png',{exact:true}).isVisible());
    assert.equal(await image().evaluate(el=>el.files[0].name),sentFile);
    assert.equal(await page.evaluate(()=>window.actionCalls[0].data.relationshipId), await page.evaluate(()=>window.snapshot.relationships[0].relationshipId));
    await page.getByRole('button',{name:'Sending image…',exact:true}).scrollIntoViewIfNeeded();
    await capture('pending-image-locked');
    await settle('success');
    await page.getByRole('button',{name:'Send image',exact:true}).waitFor();
    assert(await image().isEnabled());
    assert.equal(await page.getByText('QA first submitted.png',{exact:true}).count(),0);
    assert.equal(await image().evaluate(el=>el.files.length),0);
    await image().setInputFiles(file('QA second selection.png'));
    assert(await page.getByRole('button',{name:'Send image',exact:true}).isEnabled());
    record('image-inflight-selection', 'PASS', {sentFile,note:'File picker, label and Remove are disabled while sending; submitted file/relationship preserved. Successful isolated response clears preview and input together; a new selection works.'});

    await go('student');
    for (const invalid of [
        {name:'QA empty.png',mimeType:'image/png',buffer:Buffer.alloc(0)},
        {name:'QA oversized.png',mimeType:'image/png',buffer:Buffer.alloc(8388609)}
    ]) {
        await image().setInputFiles(invalid);
        assert(await page.getByRole('alert').isVisible());
        assert(await page.getByRole('button',{name:'Send image',exact:true}).isDisabled());
    }
    assert.equal(await page.evaluate(() => window.actionCalls.length), 0);
    record('invalid-image-boundaries','PASS','Zero-byte and over-8MB images show an error and cannot be submitted.');

    await go('work');
    await page.getByRole('combobox',{name:'Work status',exact:true}).click();
    await page.getByRole('option',{name:'All statuses',exact:true}).click();
    await page.getByRole('textbox',{name:'Search',exact:true}).fill('QA NO MATCH EXISTING WORK');
    assert(await page.getByText('No work matches your filters',{exact:true}).isVisible());
    assert(await page.getByText(/Search: QA NO MATCH EXISTING WORK/).isVisible());
    const actualWork = await page.evaluate(() => ({reviews:window.snapshot.tradeReviews.length,tasks:window.snapshot.coachingTasks.length,sessions:window.snapshot.coachingSessions.length}));
    assert(actualWork.reviews + actualWork.tasks + actualWork.sessions > 0);
    record('filtered-work-empty','PASS',{actualWork,note:'A nonmatching search identifies active filters and offers Clear filters rather than create-work guidance.'});
    await page.locator('[role="listbox"]').waitFor({state:'detached'});
    await page.getByText('No work matches your filters',{exact:true}).scrollIntoViewIfNeeded();
    await capture('filtered-work-empty');
    await page.getByRole('button',{name:'Custom',exact:true}).click();
    await page.getByLabel('Start date',{exact:true}).fill('2035-01-01');
    await page.getByLabel('End date',{exact:true}).fill('2035-01-02');
    await page.getByRole('button',{name:'Clear filters',exact:true}).click();
    assert.equal(await page.getByRole('textbox',{name:'Search',exact:true}).inputValue(),'');
    assert.equal(await page.getByLabel('Start date',{exact:true}).count(),0);
    assert.equal(await page.getByRole('spinbutton',{name:'Number of days',exact:true}).inputValue(),'5');
    assert.equal(await page.getByRole('combobox',{name:'Work status',exact:true}).innerText(),'Active work');
    assert.equal(await page.getByText('No work matches your filters',{exact:true}).count(),0);
    record('filtered-work-recovery','PASS','Clear filters restores the default Upcoming/5 days/active view and existing work.');
    return observations;
};
