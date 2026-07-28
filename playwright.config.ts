import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  // Corre con playwright.data-journey.config.ts: necesita el dev server de landing.
  testIgnore: "data-journey.visual.spec.ts",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: "list",
  timeout: 20_000,
  expect: {
    timeout: 5_000,
  },
  use: {
    trace: "retain-on-failure",
  },
});
