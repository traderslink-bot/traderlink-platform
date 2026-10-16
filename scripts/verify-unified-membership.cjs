// Inert Node harness: resolve Next's compile-time server-only marker for source
// checks without starting Next, workers or any network services.
const Module = require("node:module");
const originalLoad = Module._load;
Module._load = function (id, ...args) {
  if (id.endsWith(".module.css")) return { __esModule: true, default: new Proxy({}, { get: (_, key) => String(key) }) };
  if (id === "./unified-plan-discord-actions") return { loadPlanDiscordChoices: async () => { throw Error("SSR must not call Discord"); } };
  return id === "server-only" ? {} : originalLoad.call(this, id, ...args);
};
global.React = require("react");
require("tsx/cjs");
require("../src/scripts/verify-membership-plan-editor.ts");
require("../src/scripts/verify-membership-discord-editor.ts");
require("../src/scripts/verify-membership-plan-ui.tsx");
