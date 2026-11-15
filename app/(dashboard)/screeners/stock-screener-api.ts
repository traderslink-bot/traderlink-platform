import { PLATFORM_MUTATION_REQUEST_HEADER } from "@/src/modules/platform/contracts/platform-request-security";

export async function requestStockScreeners<T>(query: string, payload?: unknown): Promise<T> {
  let response: Response;
  let data;
  try {
    response = await fetch("/api/stock-screeners" + query, payload === undefined ? { cache: "no-store" } : {
      method: "POST", headers: { "Content-Type": "application/json", [PLATFORM_MUTATION_REQUEST_HEADER]: "1" },
      body: JSON.stringify(payload),
    });
    data = await response.json();
  } catch (error) {
    throw new Error("request_interrupted", { cause: error });
  }
  if (!response.ok) throw Error(data?.error ?? "request_failed");
  return data as T;
}
