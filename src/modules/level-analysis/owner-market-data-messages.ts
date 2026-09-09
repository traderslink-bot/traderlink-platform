export function ownerMarketDataMessage(reason: string | null): string | null {
  if (!reason) return null;
  if (reason.startsWith("partial:")) return `Partial candles were saved; full-session retrieval did not finish. ${ownerMarketDataMessage(reason.slice(8))}`;
  const messages: Record<string, string> = {
    shared_connection_unavailable: "The shared Moomoo connection is unavailable. Reconnect it and retry.",
    moomoo_connection_unavailable: "The shared Moomoo connection is unavailable. Reconnect it and retry.",
    moomoo_request_failed: "The application could not reach Moomoo.",
    moomoo_http_unavailable: "Moomoo returned an unsuccessful HTTP response.",
    moomoo_json_invalid: "Moomoo returned a response the application could not read as JSON.",
    moomoo_payload_invalid: "Moomoo returned an unexpected response format.",
    moomoo_provider_rejected: "Moomoo rejected the candle request.",
    moomoo_candle_invalid: "Moomoo returned a candle with missing or invalid price, volume, or time values.",
    moomoo_duplicate_candle_conflict: "Moomoo returned conflicting candles for the same minute.",
    moomoo_returned_no_candles: "Moomoo returned no candles for this session.",
    moomoo_pagination_invalid: "Moomoo indicated more data but did not provide a usable next page.",
    moomoo_pagination_incomplete: "The request could not finish retrieving all Moomoo pages. Retry the session.",
    application_request_failed: "The application could not finish this request.",
    persistence_failed: "The application could not save the result. Failure history may also be unavailable.",
    saved_session_retained: "The refresh returned fewer saved minutes or less coverage. The previous session remains selected.",
    moomoo_reported_no_coverage: "An earlier request was recorded as unavailable; its response did not distinguish a provider rejection from a format error.",
  };
  return messages[reason] ?? "An earlier request failed without a recognized explanation. Retry to obtain a current result.";
}
