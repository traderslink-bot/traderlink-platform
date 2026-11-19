import "server-only";
import {NextRequest} from "next/server";
import {resolvePlatformPublicOrigin} from "../../../platform/server/authentication/platform-public-origin";

/** The configured public host, never Railway's container or forwarded headers. */
export function statsRequestPublicHostname(request:Request):string{
  return new URL(resolvePlatformPublicOrigin(new NextRequest(request.url,{headers:request.headers}))).hostname.toLowerCase();
}

/** Report reads have no request object. Correct derived historical self-referrals
 * only when existing validated deployment configuration proves the public host.
 * The synthetic request is solely input to the shared configuration validator;
 * it supplies no session, identity or authorization evidence. */
export function statsConfiguredPublicHostname():string|null{
  const preview=process.env.NODE_ENV==="development"&&process.env.TRADERLINK_PRIVATE_LIVE_PREVIEW==="coaching"
    ?process.env.TRADERLINK_PRIVATE_LIVE_PREVIEW_ORIGIN:undefined;
  const configured=preview||process.env.TRADERLINK_PLATFORM_PUBLIC_ORIGIN
    ||(process.env.NODE_ENV==="production"?process.env.DISCORD_REDIRECT_URI:undefined);
  if(!configured)return null;
  const url=new URL(configured);
  return statsRequestPublicHostname(new Request(url,{headers:{host:url.host}}));
}
