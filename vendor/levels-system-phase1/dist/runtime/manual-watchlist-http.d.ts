import type { IncomingMessage, ServerResponse } from "node:http";
export declare const LOCAL_BIND_HOST = "127.0.0.1";
export declare const MAX_JSON_BODY_BYTES: number;
export declare class RequestBodyParseError extends Error {
    readonly statusCode: number;
    constructor(statusCode: number, message: string);
}
export declare function sendJson(response: ServerResponse, statusCode: number, payload: unknown): void;
export declare function readJsonBody(request: IncomingMessage, maxBytes?: number): Promise<Record<string, unknown>>;
//# sourceMappingURL=manual-watchlist-http.d.ts.map