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

function genieBox(page: Awaited<ReturnType<typeof openFixture>>) {
  return page.locator("ai-privacy-guard").evaluate((host) => {
    const genie = host.shadowRoot?.querySelector(".security-genie");
    if (genie === null || genie === undefined) return null;
    const rect = genie.getBoundingClientRect();
    return { x: Math.round(rect.left), y: Math.round(rect.top) };
  });
}

test("mascot can be dragged and keeps the dropped position", async ({
  context,
}) => {
  const failures: string[] = [];
  context.on("page", (opened) => {
    opened.on("pageerror", (error) => failures.push(`pageerror: ${error.message}`));
    opened.on("console", (message) => {
      if (message.type() === "error") failures.push(`console: ${message.text()}`);
    });
  });

  const page = await openFixture(context);
  const before = await genieBox(page);
  expect(before).not.toBeNull();

  await page.mouse.move(before!.x + 56, before!.y + 56);
  await page.mouse.down();
  await page.mouse.move(400, 200, { steps: 12 });
  await page.mouse.up();

  const after = await genieBox(page);
  expect(after).toEqual({ x: 344, y: 144 });

  await page.reload();
  await expect(page.locator("ai-privacy-guard")).toBeAttached();
  await expect.poll(() => genieBox(page)).toEqual({ x: 344, y: 144 });
  expect(failures).toEqual([]);
});
