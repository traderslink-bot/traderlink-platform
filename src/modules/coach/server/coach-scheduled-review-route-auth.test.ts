import { GET } from "@/app/api/cron/ai-reviews/route";

describe("scheduled AI Review route", () => {
  const originalSecret = process.env.CRON_SECRET;

  afterEach(() => {
    if (originalSecret === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = originalSecret;
  });

  it("rejects requests when the scheduler secret is unavailable", async () => {
    delete process.env.CRON_SECRET;
    const response = await GET(new Request("http://localhost/api/cron/ai-reviews"));
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ ok: false });
  });

  it("rejects a mismatched scheduler credential", async () => {
    process.env.CRON_SECRET = "expected-secret";
    const response = await GET(new Request("http://localhost/api/cron/ai-reviews", {
      headers: { authorization: "Bearer wrong-secret" },
    }));
    expect(response.status).toBe(401);
  });
});
