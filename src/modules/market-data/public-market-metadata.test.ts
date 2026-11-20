import { expect, it } from "vitest";
import { publicMarketMetadata } from "./public-market-metadata";

it("removes nested routing/credential fields while preserving exact ordinary facts and document citations",()=>{
 const input={country:"US",float:10000000,price:.0277,sourceUrl:"https://www.sec.gov/Archives/edgar/data/example",sourceLabel:"Daily high",context:{provider:"finnhub",apiKey:"PRIVATE_CANARY",value:.029},api_key:"PRIVATE_CANARY",headers:{Authorization:"PRIVATE_CANARY"}};
 expect(publicMarketMetadata(input)).toEqual({country:"US",float:10000000,price:.0277,sourceUrl:input.sourceUrl,sourceLabel:"Daily high",context:{value:.029}});expect(input.context.apiKey).toBe("PRIVATE_CANARY");
});
it("rejects API/internal URLs and credential query parameters while retaining public filings and issuer links",()=>{
 for(const sourceUrl of ["https://data.example.invalid/v2/stocks/TEST","https://api.example.invalid/profile","http://127.0.0.1/private","https://issuer.example/research?api_key=PRIVATE_CANARY","https://user:PRIVATE_CANARY@issuer.example/research"]){expect(publicMarketMetadata({sourceUrl})).toEqual({});}
 for(const sourceUrl of ["https://www.sec.gov/Archives/edgar/data/example","https://issuer.example/investors/report.pdf"]){expect(publicMarketMetadata({sourceUrl})).toEqual({sourceUrl});}
});
it("preserves financial evidence strings byte-exact unless a private field needs projection",()=>{
 const resistanceEvidence='[ {"price":0.03, "evidenceCount":2} ]';expect(publicMarketMetadata({resistanceEvidence})).toEqual({resistanceEvidence});
 const projected=publicMarketMetadata({resistanceEvidence:'[{"price":0.03,"provider":"moomoo","access_token":"PRIVATE_CANARY"}]'});expect(projected.resistanceEvidence).toBe('[{"price":0.03}]');
});
it("is idempotent and keeps repeated valid references while handling cycles without mutating input",()=>{
 const shared={price:.029};const input:{rows:typeof shared[];self?:unknown}={rows:[shared,shared]};input.self=input;const clean=publicMarketMetadata(input);expect(clean).toEqual({rows:[{price:.029},{price:.029}]});expect(publicMarketMetadata(clean)).toEqual(clean);expect(input.self).toBe(input);
});

it.each([
 "[fd00::1]", "[fc00:1234::abcd]", "[fe80::1]", "[febf::123]", "[fec0::1]", "[::]", "[::1]",
 "[0:0:0:0:0:0:0:1]", "[::ffff:127.0.0.1]", "[::ffff:7f00:1]", "[::ffff:192.168.1.2]",
 "[::ffff:a00:1]", "[::ffff:a9fe:101]", "[::127.0.0.1]", "[ff02::1]", "0.0.0.0", "100.64.0.1",
])("omits private/link-local/mapped literal citation hosts without a DNS lookup: %s", host => {
 expect(publicMarketMetadata({sourceUrl:`http://${host}/research`,price:.0277})).toEqual({price:.0277});
});
it.each(["[2606:4700:4700::1111]", "[::ffff:8.8.8.8]", "8.8.8.8", "172.15.1.1", "www.sec.gov"])("retains public literal and ordinary citation hosts: %s", host => {
 const sourceUrl=`https://${host}/research`;expect(publicMarketMetadata({sourceUrl,price:.0277})).toEqual({sourceUrl,price:.0277});
});
