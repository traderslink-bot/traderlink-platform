export const LOCAL_BIND_HOST = "127.0.0.1";
export const MAX_JSON_BODY_BYTES = 8 * 1024;
export class RequestBodyParseError extends Error {
    statusCode;
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
        this.name = "RequestBodyParseError";
    }
}
function getContentType(request) {
    const rawHeader = request.headers["content-type"];
    const header = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader;
    return header?.split(";")[0]?.trim().toLowerCase() ?? null;
}
function getContentLength(request) {
    const rawHeader = request.headers["content-length"];
    const header = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader;
    if (!header) {
        return null;
    }
    const parsed = Number(header);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}
export function sendJson(response, statusCode, payload) {
    response.statusCode = statusCode;
    response.setHeader("Content-Type", "application/json; charset=utf-8");
    response.end(`${JSON.stringify(payload)}\n`);
}
export async function readJsonBody(request, maxBytes = MAX_JSON_BODY_BYTES) {
    if (getContentType(request) !== "application/json") {
        throw new RequestBodyParseError(415, "Content-Type must be application/json.");
    }
    const declaredLength = getContentLength(request);
    if (declaredLength !== null && declaredLength > maxBytes) {
        throw new RequestBodyParseError(413, `Request body too large. Max ${maxBytes} bytes.`);
    }
    const chunks = [];
    let totalBytes = 0;
    for await (const chunk of request) {
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        totalBytes += buffer.length;
        if (totalBytes > maxBytes) {
            throw new RequestBodyParseError(413, `Request body too large. Max ${maxBytes} bytes.`);
        }
        chunks.push(buffer);
    }
    if (chunks.length === 0) {
        return {};
    }
    try {
        return JSON.parse(Buffer.concat(chunks).toString("utf8"));
    }
    catch {
        throw new RequestBodyParseError(400, "Invalid JSON body.");
    }
}
