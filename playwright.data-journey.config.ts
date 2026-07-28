import { defineConfig } from "@playwright/test";

const baseURL = "http://127.0.0.1:4174";

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "data-journey.visual.spec.ts",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: "list",
  timeout: 20_000,
  expect: {
    timeout: 5_000,
  },
  use: {
    baseURL,
    trace: "retain-on-failure",
  },
  webServer: {
    command:
      "npx --yes node@24 landing/node_modules/vite/bin/vite.js landing --host 127.0.0.1 --port 4174",
    url: `${baseURL}/data-journey-test.html`,
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
