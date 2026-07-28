import type { BrowserContext, Page } from "@playwright/test";
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

function genieCenter(page: Page) {
  return page.locator("ai-privacy-guard").evaluate((host) => {
    const rect = host
      .shadowRoot!.querySelector(".security-genie")!
      .getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  });
}

const corners = [
  { name: "arriba a la izquierda", x: 90, y: 90 },
  { name: "arriba a la derecha", x: 1180, y: 90 },
  { name: "abajo a la izquierda", x: 90, y: 620 },
  { name: "abajo a la derecha", x: 1180, y: 620 },
];

for (const corner of corners) {
  test(`the explanation stays fully on screen with the genie ${corner.name}`, async ({
    context,
  }) => {
    const page = await openFixture(context);
    await page.setViewportSize({ width: 1280, height: 720 });

    const start = await genieCenter(page);
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(corner.x, corner.y, { steps: 10 });
    await page.mouse.up();

    const spot = await genieCenter(page);
    await page.mouse.click(spot.x, spot.y);

    await expect
      .poll(() =>
        page.locator("ai-privacy-guard").evaluate((host) => {
          const info = host.shadowRoot?.querySelector(
            '[data-surface="genie-info"]',
          );
          return info === null || info === undefined
            ? "0"
            : getComputedStyle(info).opacity;
        }),
      )
      .toBe("1");

    const box = await page.locator("ai-privacy-guard").evaluate((host) => {
      const info = host.shadowRoot?.querySelector(
        '[data-surface="genie-info"]',
      );
      if (info === null || info === undefined) return null;
      const r = info.getBoundingClientRect();
      return {
        offTop: Math.round(Math.min(r.top, 0)),
        offLeft: Math.round(Math.min(r.left, 0)),
        offRight: Math.round(Math.max(r.right - window.innerWidth, 0)),
        offBottom: Math.round(Math.max(r.bottom - window.innerHeight, 0)),
      };
    });

    expect(box).toEqual({
      offTop: 0,
      offLeft: 0,
      offRight: 0,
      offBottom: 0,
    });
  });
}
