import {describe,it,expect} from "vitest";
import {STOCK_LEVELS_HELP_GUIDES} from "../help/stock-levels-guides";
import {REVERSE_SPLIT_HELP_GUIDE} from "../help/reverse-split-guides";

describe("public market-data Help copy",()=>{
 it("describes stock tools without naming their private data suppliers",()=>{expect(JSON.stringify(STOCK_LEVELS_HELP_GUIDES)).not.toMatch(/alpaca|finnhub|eodhd|moomoo/i);expect(JSON.stringify(REVERSE_SPLIT_HELP_GUIDE)).not.toMatch(/alpaca|finnhub|eodhd/i);});
 it("keeps meaningful flag/float semantics instead of removing useful guidance",()=>{const text=JSON.stringify([STOCK_LEVELS_HELP_GUIDES,REVERSE_SPLIT_HELP_GUIDE]);expect(text).toContain('company-profile country, not the listing exchange');expect(text).toContain('Float is the reported estimate, not shares outstanding.');expect(text).toContain('historical float');});
});
