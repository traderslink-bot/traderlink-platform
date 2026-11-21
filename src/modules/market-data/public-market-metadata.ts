/** Public market facts only. Shared with browser merges: never embed supplier identities here. */
const routingKey = /^(?:(?:(?:marketdata|marketcap|float|quote|candle|price|company))?(?:provider|vendor|source)|provider(?:name|symbol|source|metadata|url)|sourceprovider|feed|upstream(?:url|uri|origin)?|gateway(?:url|uri|origin)?|api(?:url|uri|origin|endpoint)|endpoint|origin|transport|headers|authorization|cookies?|setcookie|debug|trace(?:id)?|requestid|stack(?:trace)?|config|environment)$/i;
const credentialKey = /(?:apikey|password|credentials?|secrets?|tokens?)$|^(?:access|refresh|auth|bearer|gateway|upstream|publisher|session)(?:token|secret|credential)/i;
const normalizedKey = (key: string) => key.replace(/[_-]/g, "");
const privateKey = (key: string) => routingKey.test(normalizedKey(key)) || credentialKey.test(normalizedKey(key))
  || key === "__proto__" || key === "constructor" || key === "prototype";
const jsonRoutingHint = /"[^"\n]*(?:provider|vendor|source|api.?key|token|secret|credential|password|authorization|cookie|debug|transport|upstream|gateway|url|uri)[^"\n]*"\s*:/i;

function privateIpv4(parts: number[]): boolean {
  const [a, b] = parts;
  return a === 0 || a === 10 || a === 127 || a >= 224 ||
    a === 100 && b >= 64 && b <= 127 || a === 169 && b === 254 ||
    a === 172 && b >= 16 && b <= 31 || a === 192 && b === 168 ||
    a === 198 && (b === 18 || b === 19);
}

/** URL has already canonicalized literal spelling; no DNS or network lookup. */
function privateLiteral(host: string): boolean {
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) return privateIpv4(host.split(".").map(Number));
  if (!host.startsWith("[")) return false;
  const halves = host.slice(1, -1).split("::");
  const left = halves[0] ? halves[0].split(":").map(word => parseInt(word, 16)) : [];
  const right = halves[1] ? halves[1].split(":").map(word => parseInt(word, 16)) : [];
  const words = halves.length === 2 ? [...left, ...Array(8 - left.length - right.length).fill(0), ...right] : left;
  if (words.length !== 8 || words.some(word => !Number.isFinite(word))) return true;
  if ((words[0] & 0xfe00) === 0xfc00 || (words[0] & 0xffc0) === 0xfe80 ||
    (words[0] & 0xffc0) === 0xfec0 || (words[0] & 0xff00) === 0xff00) return true;
  if (words.slice(0, 6).every(word => word === 0) ||
    words.slice(0, 5).every(word => word === 0) && words[5] === 0xffff) {
    return privateIpv4([words[6] >> 8, words[6] & 255, words[7] >> 8, words[7] & 255]);
  }
  return false;
}

function publicUrl(value: string): boolean {
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) return false;
    const host = url.hostname.toLowerCase();
    if (host === "localhost" || privateLiteral(host)
      || /\.(?:localhost|local|internal)$/.test(host)) return false;
    if (/^(?:api\d*|openapi|stream(?:ing)?|gateway|ws)\./.test(host)
      || host.split(".").length > 2 && /^data\./.test(host)
      || /^\/(?:api|oauth|token)(?:\/|$)/i.test(url.pathname)
      || /^\/v\d+\/(?:stocks|quotes|bars|candles|snapshots?|profile)(?:\/|$)/i.test(url.pathname)) return false;
    for (const key of url.searchParams.keys()) if (privateKey(key) || /^(?:key|auth|signature)$/i.test(key)) return false;
    return true;
  } catch { return false; }
}

/** Preserve numbers, text and research citations; omit transport, credential and diagnostic metadata recursively. */
export function publicMarketMetadata<T>(value: T): T {
  const ancestors = new WeakSet<object>();
  const clean = (input: unknown, depth: number, key = ""): unknown => {
    if (depth > 32) return undefined;
    if (typeof input === "string") {
      const text = input.trim();
      if ((/(?:url|uri)$/i.test(key) || /^https?:\/\//i.test(text)) && !publicUrl(text)) return undefined;
      // Most evidence strings have only financial fields: leave those byte-exact and avoid parsing every update.
      if (/^[{[]/.test(text) && jsonRoutingHint.test(text)) {
        if (text.length > 1_000_000) return undefined;
        try {
          const parsed = JSON.parse(text) as unknown;
          const projected = clean(parsed, depth + 1);
          return JSON.stringify(projected) === JSON.stringify(parsed) ? input : JSON.stringify(projected);
        } catch { return undefined; }
      }
      return input;
    }
    if (input === null || typeof input === "boolean" || typeof input === "number" && Number.isFinite(input)) return input;
    if (!input || typeof input !== "object" || ancestors.has(input)) return undefined;
    ancestors.add(input);
    const result = Array.isArray(input)
      ? input.flatMap(item => { const next = clean(item, depth + 1); return next === undefined ? [] : [next]; })
      : Object.fromEntries(Object.entries(input).flatMap(([name, item]) => {
          if (privateKey(name)) return [];
          const next = clean(item, depth + 1, name);
          return next === undefined ? [] : [[name, next]];
        }));
    ancestors.delete(input);
    return result;
  };
  return clean(value, 0) as T;
}
