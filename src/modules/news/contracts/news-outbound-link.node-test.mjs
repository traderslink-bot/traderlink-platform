import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { test } from 'node:test';

// Resolve the existing bundler-style TS import without changing production source.
registerHooks({ resolve(specifier, context, nextResolve) {
  return nextResolve(specifier === './public-news-url' && context.parentURL?.endsWith('/news-outbound-link.ts')
    ? './public-news-url.ts' : specifier, context);
}});
const { newsSourceLink, newsArticleLink, newsDisplayLink, newsSummaryUnavailable, SUMMARY_UNAVAILABLE_MESSAGE, dashboardPressReleaseSourceLink }
  = await import('./news-outbound-link.ts');

test('blocks the NuntioBot DNS boundary, canonical spellings and credentials', () => {
  for (const url of ['https://nuntiobot.com/a', 'http://news.nuntiobot.com/a', 'https://a.b.nuntiobot.com/',
    'https://NUNTIOBOT.COM./a', 'https://%6euntiobot.com/a', 'https://businesswire.com@nuntiobot.com/a',
    'https://nuntiobot.com:443/a', '//news.nuntiobot.com/a', 'javascript:alert(1)', 'data:text/html,test',
    'https://name:password@businesswire.com/a', 'not a URL', '', null, undefined]) {
    assert.equal(newsSourceLink(url), null, String(url));
  }
});
test('allows original publishers without substring blocking unrelated hosts', () => {
  for (const url of ['https://www.businesswire.com/news/home/example', 'https://newsfilter.io/a',
    'https://www.sec.gov/Archives/edgar/data/1/filing.htm', 'https://notnuntiobot.com/',
    'https://nuntiobot.com.example.org/', 'https://example.org/nuntiobot.com?source=news.nuntiobot.com']) {
    assert.equal(newsSourceLink(url), new URL(url).href, url);
  }
});
test('successful summaries use TradersLink; unavailable summaries use only allowed publishers', () => {
  const path = '/news/TEST/story';
  assert.equal(newsArticleLink(path, false, 'https://news.nuntiobot.com/story'), 'https://traderslink.pro/news/TEST/story');
  assert.equal(newsArticleLink(path, true, 'https://news.nuntiobot.com/story'), null);
  assert.equal(newsArticleLink(path, true, null), null);
  for (const source of ['https://newsfilter.io/story', 'https://www.businesswire.com/story', 'https://www.sec.gov/Archives/filing.htm'])
    assert.equal(newsArticleLink(path, true, source), source);
});
test('classifies historical fallback records consistently without changing stored evidence', () => {
  for (const summary of [null, '', '  ', 'Summary could not be generated.', 'Summary could not be generated',
    ' Full article text is currently unavailable. More context']) assert.equal(newsSummaryUnavailable(summary, 'press_release', {}), true);
  for (const articleSourceMode of ['headline_only_fallback', 'businesswire_headline_only', 'sec_unreadable_fallback', 'market_cap_stale_skip'])
    assert.equal(newsSummaryUnavailable('Stored fallback', 'press_release', {articleSourceMode}), true);
  assert.equal(newsSummaryUnavailable('Stored fallback', 'press_release_unreadable', {}), true);
  assert.equal(newsSummaryUnavailable('Actual summary.', 'sec_current_report', {articleSourceMode:'fetched_direct'}), false);
  assert.equal(SUMMARY_UNAVAILABLE_MESSAGE, 'Summary could not be generated.');
});
test('preserves local reader paths and prevents scheme-relative or backslash escapes', () => {
  assert.equal(newsDisplayLink('/news/TEST/story'), '/news/TEST/story');
  assert.equal(newsDisplayLink('https://www.sec.gov/Archives/filing.htm'), 'https://www.sec.gov/Archives/filing.htm');
  for (const value of ['//news.nuntiobot.com/story', '/\\news.nuntiobot.com/story', 'https://news.nuntiobot.com/story'])
    assert.equal(newsDisplayLink(value), null, value);
});

test('dashboard details never offer public article links; only failed summaries have publisher actions', () => {
  for (const sourceUrl of ['https://www.businesswire.com/story','https://traderslink.pro/news/TEST/story','https://news.nuntiobot.com/story'])
    assert.equal(dashboardPressReleaseSourceLink({summaryUnavailable:false,sourceUrl}),null);
  for (const sourceUrl of ['https://traderslink.pro/news/TEST/story','https://news.nuntiobot.com/story'])
    assert.equal(dashboardPressReleaseSourceLink({summaryUnavailable:true,sourceUrl}),null);
  assert.equal(dashboardPressReleaseSourceLink({summaryUnavailable:true,sourceUrl:'https://www.businesswire.com/story'}),'https://www.businesswire.com/story');
});
