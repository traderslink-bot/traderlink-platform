// @vitest-environment node
import {expect,it,vi} from "vitest";
import {parseFinnhubExchange,readFinnhubExchanges} from "./finnhub-exchange";

it("maps only confirmed Nasdaq and NYSE Finnhub profiles",()=>{
  expect(parseFinnhubExchange({ticker:"AAA",exchange:"NASDAQ NMS - GLOBAL MARKET"},"AAA")).toBe("NASDAQ");
  expect(parseFinnhubExchange({ticker:"BBB",exchange:"NEW YORK STOCK EXCHANGE, INC."},"BBB")).toBe("NYSE");
  expect(parseFinnhubExchange({ticker:"ARC",exchange:"NYSE ARCA"},"ARC")).toBeNull();
  expect(parseFinnhubExchange({ticker:"WRONG",exchange:"NASDAQ"},"AAA")).toBeNull();
});
it("starts one Finnhub request and serves the confirmed exchange from cache",async()=>{
  const request=vi.fn(async()=>Response.json({ticker:"CACHE",exchange:"NASDAQ"}));
  const input={tradingDate:"2026-11-05",symbols:["CACHE"],token:"secret",request};
  expect(readFinnhubExchanges(input).size).toBe(0);
  await vi.waitFor(()=>expect(readFinnhubExchanges(input).get("CACHE")).toBe("NASDAQ"));
  expect(request).toHaveBeenCalledTimes(1);
});
