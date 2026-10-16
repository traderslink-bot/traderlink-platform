const local = value => ['localhost', '127.0.0.1', '::1', '[::1]'].includes(value) || (process.env.MEMBERSHIP_QA_BUILD_FONTS === '1' && ['fonts.googleapis.com', 'fonts.gstatic.com'].includes(value));
const originalFetch = global.fetch;
global.fetch = (url, ...args) => { const parsed = new URL(typeof url === 'string' || url instanceof URL ? url : url.url); if (!local(parsed.hostname))
    throw Error('QA external fetch denied'); return originalFetch(url, ...args); };
for (const protocol of ['node:http', 'node:https']) {
    const transport = require(protocol);
    for (const name of ['request', 'get']) {
        const original = transport[name];
        transport[name] = function (input, ...args) { const host = typeof input === 'string' || input instanceof URL ? new URL(input).hostname : input?.hostname || input?.host || 'localhost'; if (!local(host))
            throw Error('QA external transport denied'); return original.call(this, input, ...args); };
    }
}
