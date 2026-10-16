const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const source = fs.readFileSync(path.resolve(__dirname, '../../app/api/admin/communities/coaching-archives/[archiveId]/route.ts'), 'utf8');
const output = {};
let allowed = false, expired = false, fileExists = true, reads = 0;
vm.runInNewContext(ts.transpileModule(source, {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText, {
  exports:output, Response, URL, Uint8Array,
  require(id) {
    if(id.endsWith('/platform-admin-authorization')) return {withJournalAdminDatabase(headers, fn) {
      assert.equal(headers.get('x-fixture'),'test');
      if(!allowed) throw new Error('not an authorized platform owner');
      return fn({prepare(sql){assert.match(sql,/expires_at_utc>\?/);return {get(archiveId,attachmentId){
        assert.equal(archiveId,'archive');assert.equal(attachmentId,'image');
        return fileExists?{content:Buffer.from([1,2,3]),media_type:'image/png'}:undefined;
      }}}});
    }};
    if(id.endsWith('/coaching-deletion-archive')) return {readCoachingDeletionArchive(_db,id){reads++;assert.equal(id,'archive');return expired?null:{records:[],files:[]};}};
    throw new Error(`Unexpected import ${id}`);
  },
});
const context={params:Promise.resolve({archiveId:'archive'})};
const request=(suffix='')=>new Request(`https://example.test/archive${suffix}`,{headers:{'x-fixture':'test'}});
(async()=>{
  let response=await output.GET(request(),context);
  assert.equal(response.status,403);assert.equal(reads,0);
  assert.equal(response.headers.get('cache-control'),'private, no-store');
  allowed=true;
  response=await output.GET(request(),context);assert.equal(response.status,200);
  response=await output.GET(request('?attachment=image'),context);
  assert.equal(response.status,200);assert.equal(response.headers.get('content-type'),'image/png');
  assert.equal(response.headers.get('x-content-type-options'),'nosniff');
  assert.deepEqual([...new Uint8Array(await response.arrayBuffer())],[1,2,3]);
  fileExists=false;assert.equal((await output.GET(request('?attachment=image'),context)).status,404);
  expired=true;assert.equal((await output.GET(request(),context)).status,404);
  assert.equal((await output.GET(request('?attachment=image'),context)).status,404);
  console.log('PASS: admin gate before reads, expired archive/attachment denial, scoped file lookup, bytes and no-store');
})().catch(error=>{console.error(error);process.exitCode=1;});
