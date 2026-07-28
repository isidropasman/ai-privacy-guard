import { chromium, test as base, type BrowserContext } from "@playwright/test";
import path from "node:path";

export const test = base.extend<{ context: BrowserContext }>({
  context: async ({}, use) => {
    const extensionPath = path.resolve(".output/chrome-mv3");
    const context = await chromium.launchPersistentContext("", {
      channel: "chromium",
      headless: true,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
      ],
    });

    await use(context);
    await context.close();
  },
});

export const expect = test.expect;
