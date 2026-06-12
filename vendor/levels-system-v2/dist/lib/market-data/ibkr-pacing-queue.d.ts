export declare class IbkrPacingQueue {
    private readonly queue;
    private readonly timestamps;
    private activeRequests;
    private processing;
    enqueue<T>(task: () => Promise<T>): Promise<T>;
    private pruneTimestamps;
    private waitForCapacity;
    private processQueue;
    resetForTests(): void;
}
export declare const sharedIbkrPacingQueue: IbkrPacingQueue;
//# sourceMappingURL=ibkr-pacing-queue.d.ts.map