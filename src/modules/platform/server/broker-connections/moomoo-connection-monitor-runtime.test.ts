// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { openPlatformDatabase } from "../database/open-platform-database";
import { runMoomooConnectionMonitor } from "./moomoo-connection-monitor";
vi.mock("../database/open-platform-database",()=>({openPlatformDatabase:vi.fn()}));
vi.mock("./moomoo-connection-monitor",()=>({runMoomooConnectionMonitor:vi.fn()}));
afterEach(()=>{vi.useRealTimers();vi.clearAllMocks();});
describe("bounded hosted Moomoo monitor scheduling",()=>{
 it("does nothing on import, starts once, prevents overlap, closes DB and recovers from errors",async()=>{
  vi.useFakeTimers();vi.resetModules();
  const {startMoomooConnectionMonitor}=await import("./moomoo-connection-monitor-runtime");
  expect(vi.getTimerCount()).toBe(0);expect(openPlatformDatabase).not.toHaveBeenCalled();
  const db={close:vi.fn()};vi.mocked(openPlatformDatabase).mockReturnValue(db as unknown as ReturnType<typeof openPlatformDatabase>);
  let finish!:(result:{after:string;checked:number;unavailable:number})=>void;
  vi.mocked(runMoomooConnectionMonitor).mockImplementation(()=>new Promise(resolve=>{finish=resolve;}));
  startMoomooConnectionMonitor();startMoomooConnectionMonitor();expect(vi.getTimerCount()).toBe(1);
  await vi.advanceTimersByTimeAsync(180000);expect(runMoomooConnectionMonitor).toHaveBeenCalledTimes(1);
  finish({after:"cursor",checked:5,unavailable:0});await Promise.resolve();await Promise.resolve();expect(db.close).toHaveBeenCalledTimes(1);
  vi.mocked(runMoomooConnectionMonitor).mockRejectedValue(new Error("synthetic unavailable"));
  const log=vi.spyOn(console,"error").mockImplementation(()=>{});
  await vi.advanceTimersByTimeAsync(60000);expect(runMoomooConnectionMonitor).toHaveBeenCalledTimes(2);expect(db.close).toHaveBeenCalledTimes(2);expect(log).toHaveBeenCalledWith("Moomoo connection monitor unavailable.");
  vi.clearAllTimers();log.mockRestore();
 });
 it("resets its overlap guard and contains a throwing database close",async()=>{
  vi.useFakeTimers();vi.resetModules();
  const {startMoomooConnectionMonitor}=await import("./moomoo-connection-monitor-runtime");
  const close=vi.fn().mockImplementationOnce(()=>{throw new Error("synthetic close failure");});
  vi.mocked(openPlatformDatabase).mockReturnValue({close} as unknown as ReturnType<typeof openPlatformDatabase>);
  vi.mocked(runMoomooConnectionMonitor).mockResolvedValue({after:"",checked:0,unavailable:0});
  const log=vi.spyOn(console,"error").mockImplementation(()=>{});
  startMoomooConnectionMonitor();await vi.advanceTimersByTimeAsync(60000);
  expect(close).toHaveBeenCalledTimes(1);
  await vi.advanceTimersByTimeAsync(60000);
  expect(runMoomooConnectionMonitor).toHaveBeenCalledTimes(2);expect(close).toHaveBeenCalledTimes(2);
  expect(log).toHaveBeenCalledWith("Moomoo connection monitor cleanup unavailable.");
  vi.clearAllTimers();log.mockRestore();
 });

});
