const fs=require('node:fs'),assert=require('node:assert/strict');
const ts=require('C:/Users/jerac/Documents/TraderLink/traderlink-platform/node_modules/typescript');
const file='src/modules/watchlist/server/notifications/watchlist-x-buffer.ts';
const out=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const mod={exports:{}};new Function('require','module','exports',out)(id=>id==='server-only'?{}:require(id),mod,mod.exports);
const {safeXRejection,createXBufferPost,XConfirmedRejection}=mod.exports;
assert.equal(safeXRejection('Failed to fetch image dimensions: Not Found'),'Buffer rejected the X post: Failed to fetch image dimensions: Not Found');
const safe=safeXRejection('key secret123 channel abc123 https://example.com/private/token Bearer password '+ 'a'.repeat(48),['secret123','abc123']);
for(const privateText of ['secret123','abc123','example.com','password','a'.repeat(48)])assert(!safe.includes(privateText));
assert(safeXRejection('x'.repeat(2000)).length<550);
(async()=>{
 await assert.rejects(createXBufferPost({caption:'test',channel:'channel',key:'key',imageUrls:[]},async()=>({ok:true,json:async()=>({data:{createPost:{message:'Failed to fetch image dimensions: Not Found'}}})})),e=>e instanceof XConfirmedRejection&&e.message.includes('image dimensions'));
 await assert.rejects(createXBufferPost({caption:'test',channel:'channel',key:'key',imageUrls:[]},async()=>{throw Error('timeout');}),e=>!(e instanceof XConfirmedRejection));
 console.log('PASS: rejection reason retained; secrets redacted; ambiguous failures remain distinct; no network calls.');
})();
