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

// La hoja tiene 4 columnas (background-size: 400%), así que la última columna
// vive en 100%. Cualquier valor por encima apunta fuera de la imagen y deja al
// genio invisible; con `forwards` se congela así para siempre.
test("the sprite never lands outside the spritesheet after animating", async ({
  context,
}) => {
  const page = await openFixture(context);

  const spot = await page.locator("ai-privacy-guard").evaluate((host) => {
    const genie = host.shadowRoot?.querySelector(".security-genie");
    const rect = genie!.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  });
  await page.mouse.move(spot.x, spot.y);

  await expect
    .poll(
      () =>
        page.locator("ai-privacy-guard").evaluate((host) => {
          const sprite = host.shadowRoot?.querySelector(
            "[data-mascot-sprite]",
          ) as HTMLElement | null;
          if (sprite === null) return null;
          return sprite.getAnimations().some((a) => a.playState === "running");
        }),
      { timeout: 10_000 },
    )
    .toBe(false);

  const positionX = await page.locator("ai-privacy-guard").evaluate((host) => {
    const sprite = host.shadowRoot?.querySelector(
      "[data-mascot-sprite]",
    ) as HTMLElement | null;
    return sprite === null
      ? null
      : getComputedStyle(sprite).backgroundPositionX;
  });

  expect(positionX).not.toBeNull();
  expect(parseFloat(positionX!)).toBeLessThanOrEqual(100);
});
