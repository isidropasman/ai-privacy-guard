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

test("the explanation bubble fits without scrollbars", async ({ context }) => {
  const page = await openFixture(context);

  const spot = await page.locator("ai-privacy-guard").evaluate((host) => {
    const genie = host.shadowRoot?.querySelector(".security-genie");
    const rect = genie!.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  });
  await page.mouse.click(spot.x, spot.y);

  // scrollWidth sigue contando la cola que sobresale aun sin scrollbar, así que
  // la prueba real es intentar scrollear y ver si el elemento se mueve.
  // genie-bubble-enter dura 360ms arrancando en opacity 0; medir antes captura
  // el globo a medio aparecer.
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

  const visible = await page.locator("ai-privacy-guard").evaluate((host) => {
    const info = host.shadowRoot?.querySelector('[data-surface="genie-info"]');
    if (info === null || info === undefined) return "missing";
    const rect = info.getBoundingClientRect();
    return `${Math.round(rect.width)}x${Math.round(rect.height)}`;
  });
  expect(visible).not.toBe("missing");
  expect(visible).not.toBe("0x0");

  const scrollable = await page.locator("ai-privacy-guard").evaluate((host) => {
    const info = host.shadowRoot?.querySelector('[data-surface="genie-info"]');
    if (info === null || info === undefined) return null;
    info.scrollLeft = 9999;
    info.scrollTop = 9999;
    return { x: info.scrollLeft, y: info.scrollTop };
  });

  expect(scrollable).toEqual({ x: 0, y: 0 });
});
