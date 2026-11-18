// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest";
import type { ErasureCommand } from "./platform-erasure-command";
import type { TraderLinkPlatformRequestIdentity } from "../authentication/require-platform-request-scope";

const fixture = vi.hoisted(() => ({
  modules: vi.fn(), review: vi.fn(), bind: vi.fn(), readmit: vi.fn(), mutation: vi.fn(), open: vi.fn(),
}));
vi.mock("../authentication/journal-mutation-request-security", () => ({ requireJournalMutationRequest: fixture.mutation }));
vi.mock("../authentication/require-platform-request-scope", () => ({ requireTraderLinkPlatformAuthenticatedRequestIdentity: vi.fn() }));
vi.mock("../database/open-platform-database", () => ({ withPlatformDatabase: fixture.open }));
vi.mock("../../../partner-alerts/server/partner-alert-stripe-erasure-worker-input", () => ({ readPartnerAlertStripeErasureWorkerInputs: fixture.review }));
vi.mock("./platform-erasure-admission", () => ({ hasPlatformErasureModules: fixture.modules, PlatformErasureAdmission: { bind: fixture.bind } }));
vi.mock("./platform-erasure-command", () => ({ readmitAuthenticatedErasureCommand: fixture.readmit }));
import { prepareAuthenticatedErasureRequest } from "./platform-erasure-request-preparation";

const identity = { mode: "platform_session", sessionId: "fixture", scope: {} } as TraderLinkPlatformRequestIdentity;
const command = { action: "traderlink_account", mode: "platform_session", sessionId: "fixture", scope: {} } as ErasureCommand;
const request = new Request("https://fixture.example.com/api/platform/account-erasure", { method: "POST" });
beforeEach(() => {
  vi.clearAllMocks();
  fixture.modules.mockReturnValue(true);
  fixture.open.mockImplementation((_options, operation) => operation({}));
});
it("keeps ordinary legacy schema on the previous path without reading a Paid review", () => {
  fixture.modules.mockReturnValue(false);
  prepareAuthenticatedErasureRequest(request, identity, command, "/synthetic.sqlite");
  expect(fixture.mutation).toHaveBeenCalledOnce();
  expect(fixture.review).not.toHaveBeenCalled();
  expect(fixture.bind).not.toHaveBeenCalled();
  expect(fixture.readmit).not.toHaveBeenCalled();
});
it("preserves old signed formats without attempting profile renewal", () => {
  fixture.review.mockReturnValue({ assertCurrentRelease: vi.fn() });
  prepareAuthenticatedErasureRequest(request, identity, command, "/synthetic.sqlite");
  expect(fixture.review).toHaveBeenCalledOnce();
  expect(fixture.bind).not.toHaveBeenCalled();
  expect(fixture.readmit).not.toHaveBeenCalled();
});
it("refuses missing review when the module schema is installed", () => {
  fixture.review.mockReturnValue(null);
  expect(() => prepareAuthenticatedErasureRequest(request, identity, command, "/synthetic.sqlite")).toThrow();
  expect(fixture.bind).not.toHaveBeenCalled();
  expect(fixture.readmit).not.toHaveBeenCalled();
});
it("does not open a database or change the tracker-account workflow", () => {
  prepareAuthenticatedErasureRequest(request, identity, { ...command, action: "trade_tracker_account" }, "/synthetic.sqlite");
  expect(fixture.open).not.toHaveBeenCalled();
  expect(fixture.mutation).not.toHaveBeenCalled();
});
