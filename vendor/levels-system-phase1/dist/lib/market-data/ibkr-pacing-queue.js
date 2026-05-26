const MAX_REQUESTS = 60;
const WINDOW_MS = 10 * 60 * 1000;
const MIN_REQUEST_SPACING_MS = Math.ceil(WINDOW_MS / MAX_REQUESTS);
function delay(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}
export class IbkrPacingQueue {
    queue = [];
    timestamps = [];
    activeRequests = 0;
    processing = false;
    async enqueue(task) {
        return new Promise((resolve, reject) => {
            this.queue.push({
                task: () => task(),
                resolve: (value) => resolve(value),
                reject,
            });
            void this.processQueue();
        });
    }
    pruneTimestamps(now) {
        while (this.timestamps.length > 0 &&
            now - this.timestamps[0] >= WINDOW_MS) {
            this.timestamps.shift();
        }
    }
    async waitForCapacity() {
        while (true) {
            const now = Date.now();
            this.pruneTimestamps(now);
            const oldestTimestamp = this.timestamps[0];
            const lastTimestamp = this.timestamps.at(-1);
            const windowWaitMs = this.timestamps.length >= MAX_REQUESTS && oldestTimestamp !== undefined
                ? Math.max(0, WINDOW_MS - (now - oldestTimestamp))
                : 0;
            const spacingWaitMs = lastTimestamp !== undefined
                ? Math.max(0, MIN_REQUEST_SPACING_MS - (now - lastTimestamp))
                : 0;
            const waitMs = Math.max(windowWaitMs, spacingWaitMs);
            if (waitMs <= 0) {
                return;
            }
            await delay(waitMs);
        }
    }
    async processQueue() {
        if (this.processing) {
            return;
        }
        this.processing = true;
        try {
            while (this.queue.length > 0) {
                const next = this.queue.shift();
                if (!next) {
                    continue;
                }
                await this.waitForCapacity();
                this.activeRequests += 1;
                this.timestamps.push(Date.now());
                try {
                    const result = await next.task();
                    next.resolve(result);
                }
                catch (error) {
                    next.reject(error);
                }
                finally {
                    this.activeRequests = Math.max(0, this.activeRequests - 1);
                }
            }
        }
        finally {
            this.processing = false;
            if (this.queue.length > 0) {
                void this.processQueue();
            }
        }
    }
    resetForTests() {
        this.queue.length = 0;
        this.timestamps.length = 0;
        this.activeRequests = 0;
        this.processing = false;
    }
}
export const sharedIbkrPacingQueue = new IbkrPacingQueue();
