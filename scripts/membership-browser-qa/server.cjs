const req = require('node:module').createRequire(require('node:path').join(process.cwd(), 'package.json'));
const next = req('next');
const { createServer } = require('node:http');
(async () => {
    const app = next({ dev: process.env.MEMBERSHIP_QA_COMPILED !== '1', dir: process.cwd(), hostname: '127.0.0.1', port: 3027, webpack: true });
    await app.prepare();
    // Exercise real cookie/session authorization; no development-owner assertion.
    const handler = app.getRequestHandler();
    const review = process.env.MEMBERSHIP_QA_REVIEW === '1' ? require('./review-login.cjs')() : null;
    const server = createServer((request, response) => { if (!review?.(request,response)) return handler(request, response); });
    server.listen(3027, '127.0.0.1', () => console.log('Synthetic browser QA ready on loopback 3027; no workers'));
    let closing = false;
    async function close() {
        if (closing) return;
        closing = true;
        server.close();
        await app.close();
        process.exit(0);
    }
    process.on('SIGTERM', close);
    process.on('SIGINT', close);
})().catch(e => { console.error(e); process.exitCode = 1; });
