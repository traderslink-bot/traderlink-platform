import { companyWireEnabled, companyWireUrl, decodeCompanyData } from "@/src/modules/company/company-data-wire.mjs";
import "server-only";
import { unstable_cache } from "next/cache";

type CompanyResource = "directory" | "submissions" | "facts" | "profile" | "metrics";
export async function readCompanyData<T>(kind: CompanyResource, key = "", revalidate = 86_400): Promise<T | null> {
  const base = process.env.TRADERLINK_COMPANY_DATA_GATEWAY_URL;
  const token = process.env.TRADERLINK_COMPANY_DATA_GATEWAY_TOKEN;
  if (!base || !token) return null;
  const cached = unstable_cache(async () => {
    const url = new URL(base);
    const local = process.env.NODE_ENV !== "production" && url.protocol === "http:" && url.hostname === "127.0.0.1";
    if (url.username || url.password || url.search || url.hash || (url.protocol !== "https:" && !local))
      throw Error("Invalid company data gateway");
    const wire=companyWireEnabled(process.env);
    const requestUrl=wire?companyWireUrl(base,kind,key):url;
    if(!wire)requestUrl.search = new URLSearchParams({kind,key}).toString();
    const response = await fetch(requestUrl,{headers:{Authorization:`Bearer ${token}`},redirect:"error",signal:AbortSignal.timeout(10_000)});
    if (!response.ok) throw Error("Company data unavailable");
    const value=await response.json();return wire?decodeCompanyData(kind,value):value;
  },["company-data-vps-v1",base,kind,key],{revalidate});
  try { return await cached() as T; }
  catch { return null; }
}
