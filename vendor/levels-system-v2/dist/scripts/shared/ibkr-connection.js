const DEFAULT_CONNECTION_TIMEOUT_MS = 10_000;
export async function waitForIbkrConnection(ib, timeoutMs = DEFAULT_CONNECTION_TIMEOUT_MS) {
    const ibWithEvents = ib;
    if (ib.isConnected) {
        return;
    }
    await new Promise((resolve, reject) => {
        let settled = false;
        const cleanup = () => {
            clearTimeout(timeoutHandle);
            ibWithEvents.off("connected", onConnected);
            ibWithEvents.off("error", onError);
        };
        const finalizeResolve = () => {
            if (settled) {
                return;
            }
            settled = true;
            cleanup();
            resolve();
        };
        const finalizeReject = (error) => {
            if (settled) {
                return;
            }
            settled = true;
            cleanup();
            reject(error);
        };
        const onConnected = () => {
            finalizeResolve();
        };
        const onError = (error, code) => {
            if (typeof code !== "number" || code < 500 || code >= 600) {
                return;
            }
            const message = error instanceof Error
                ? error.message
                : typeof error === "string"
                    ? error
                    : "Unknown IBKR connection error.";
            finalizeReject(new Error(`IBKR connection failed (code ${code}): ${message}`));
        };
        const timeoutHandle = setTimeout(() => {
            finalizeReject(new Error(`Timed out after ${timeoutMs}ms waiting for IBKR connection.`));
        }, timeoutMs);
        ibWithEvents.on("connected", onConnected);
        ibWithEvents.on("error", onError);
        ib.connect();
    });
}
