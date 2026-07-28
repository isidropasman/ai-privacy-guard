import type { BrowserContext } from "@playwright/test";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { expect, test } from "./extension.fixture";

const fixturePath = path.resolve("tests/fixtures/chatgpt.html");

async function openFixture(context: BrowserContext) {
  const html = await readFile(fixturePath, "utf8");
  const page = await context.newPage();
  await page.route("https://chatgpt.com/**", async (route) => {
    await route.fulfill({ status: 200, contentType: "text/html", body: html });
  });
  await page.goto("https://chatgpt.com/");
  await expect(page.locator("ai-privacy-guard")).toBeAttached();
  return page;
}

test("keeps the mascot click target stable while hovering", async ({
  context,
}) => {
  // Regression: ISSUE-002 — hover moved the button hitbox indefinitely.
  // Found by /qa on 2026-07-28.
  const page = await openFixture(context);
  const trigger = page.getByRole("button", {
    name: "¿Qué hace Security Genie?",
  });

  await trigger.click();
  await expect(
    page.getByRole("heading", { name: "¿Por qué estoy acá?" }),
  ).toBeVisible();
  await trigger.click({ timeout: 3_000 });

  await expect(
    page.getByRole("heading", { name: "¿Por qué estoy acá?" }),
  ).toHaveCount(0);
});
