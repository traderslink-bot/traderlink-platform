// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { normalizePlatformWebPushEndpoint } from "./platform-web-push-subscription-crypto";
describe("push endpoint egress boundary", () => {
  it.each(["https://fcm.googleapis.com/fcm/send/token", "https://updates.push.services.mozilla.com/wpush/v2/token", "https://web.push.apple.com/token", "https://wns2.notify.windows.com/w/?token=x"])("accepts browser push service %s", (url) => expect(normalizePlatformWebPushEndpoint(url)).toBe(url));
  it.each(["https://127.0.0.1/admin", "https://[::1]/", "https://169.254.169.254/", "https://internal.example/", "https://fcm.googleapis.com.attacker.test/", "https://attacker.test/?host=fcm.googleapis.com", "https://fcm.googleapis.com:8443/", "https://user@fcm.googleapis.com/", "http://fcm.googleapis.com/", "https://fcm.googleapis.com/#x"])("rejects arbitrary destination %s", (url) => expect(() => normalizePlatformWebPushEndpoint(url)).toThrow());
});
