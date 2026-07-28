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

test("safe prompt sends once without a modal", async ({ context }) => {
  const page = await openFixture(context);
  await expect
    .poll(() =>
      page.locator("ai-privacy-guard").evaluate((host) => {
        const preload = host.shadowRoot?.querySelector(
          "img[data-mascot-preload]",
        );
        const sprite = host.shadowRoot?.querySelector("[data-mascot-sprite]");
        const trigger = host.shadowRoot?.querySelector(
          "[data-mascot-trigger]",
        );
        return preload instanceof HTMLImageElement &&
          sprite instanceof HTMLElement &&
          trigger instanceof HTMLButtonElement
          ? preload.complete && preload.naturalWidth > 0
          : false;
      }),
    )
    .toBe(true);
  await page
    .getByRole("button", { name: "¿Qué hace Security Genie?" })
    .hover();
  await expect
    .poll(() =>
      page.locator("ai-privacy-guard").evaluate((host) => {
        const trigger = host.shadowRoot?.querySelector(
          "[data-mascot-trigger]",
        );
        const sprite = host.shadowRoot?.querySelector("[data-mascot-sprite]");
        if (
          !(trigger instanceof HTMLElement) ||
          !(sprite instanceof HTMLElement)
        ) {
          return null;
        }
        return {
          triggerAnimation: getComputedStyle(trigger).animationName,
          spriteDuration: getComputedStyle(sprite).animationDuration,
        };
      }),
    )
    .toEqual({
      triggerAnimation: "security-genie-hover",
      spriteDuration: "2.6s",
    });
  await page
    .locator("#prompt-textarea")
    .fill("Explicame de manera sencilla qué es Kubernetes.");

  await page.locator("#prompt-textarea").press("Enter");

  await expect(page.locator("body[data-submit-count]")).toHaveAttribute(
    "data-submit-count",
    "1",
  );
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect
    .poll(() =>
      page.locator("ai-privacy-guard").evaluate((host) => {
        const sprite = host.shadowRoot?.querySelector("[data-mascot-sprite]");
        if (!(sprite instanceof HTMLElement)) return null;
        const style = getComputedStyle(sprite);
        return {
          duration: style.animationDuration,
          iterations: style.animationIterationCount,
          state: host.shadowRoot
            ?.querySelector("[data-mascot-state]")
            ?.getAttribute("data-mascot-state"),
        };
      }),
    )
    .toEqual({
      duration: "2.6s",
      iterations: "1",
      state: "allow",
    });
});

test("critical credential is blocked and redacted before one send", async ({
  context,
}) => {
  const page = await openFixture(context);
  await page
    .locator("#prompt-textarea")
    .fill("OPENAI_API_KEY=sk_12312434sdfsef_test_33ddd");

  await page.locator("#prompt-textarea").press("Enter");

  await expect(
    page.getByRole("heading", { name: "Este mensaje no puede salir" }),
  ).toBeVisible();
  await expect(page.locator("body[data-submit-count]")).toHaveAttribute(
    "data-submit-count",
    "0",
  );
  await page.getByRole("button", { name: "Eliminar y continuar" }).click();

  await expect(page.locator("#prompt-textarea")).toHaveValue(
    "OPENAI_API_KEY=[API_KEY_REMOVED]",
  );
  await expect(page.locator("body[data-submit-count]")).toHaveAttribute(
    "data-submit-count",
    "1",
  );
  await expect(page.locator("#last-submission")).toHaveText(
    "OPENAI_API_KEY=[API_KEY_REMOVED]",
  );
});

test("PII warning anonymizes name and email in one click", async ({
  context,
}) => {
  const page = await openFixture(context);
  await page
    .locator("#prompt-textarea")
    .fill(
      "Ayudame a escribirle a Juan Pérez. Su email es juan.perez@example.com.",
    );

  await page.locator('[data-testid="send-button"]').click();
  await expect(
    page.getByRole("heading", { name: "Encontré datos sensibles" }),
  ).toBeVisible();
  const anchoredSurface = await page
    .locator("ai-privacy-guard")
    .evaluate((host) => {
      const genie = host.shadowRoot?.querySelector(".security-genie");
      const bubble = host.shadowRoot?.querySelector(".genie-bubble");
      if (!(genie instanceof HTMLElement) || !(bubble instanceof HTMLElement)) {
        return null;
      }
      const genieStyle = getComputedStyle(genie);
      const bubbleStyle = getComputedStyle(bubble);
      return {
        geniePosition: genieStyle.position,
        bubblePosition: bubbleStyle.position,
        hasCenteredOverlay:
          host.shadowRoot?.querySelector(".modal-layer") !== null,
      };
    });
  expect(anchoredSurface).toEqual({
    geniePosition: "fixed",
    bubblePosition: "absolute",
    hasCenteredOverlay: false,
  });
  await page.getByRole("button", { name: "Anonimizar y enviar" }).click();

  await expect(page.locator("#last-submission")).toHaveText(
    "Ayudame a escribirle a [PERSON_NAME]. Su email es [EMAIL_CONTACT].",
  );
  await expect(page.locator("body[data-submit-count]")).toHaveAttribute(
    "data-submit-count",
    "1",
  );
});

test("PII redaction updates a controlled contenteditable before sending", async ({
  context,
}) => {
  const page = await openFixture(context);
  await page.locator("#recreate").click();
  const composer = page.locator('[contenteditable="true"]');
  await composer.fill(
    "Ayudame a escribirle a Juan Pérez. Su email es juan.perez@example.com.",
  );

  await page.locator('[data-testid="send-button"]').click();
  await page.getByRole("button", { name: "Anonimizar y enviar" }).click();

  await expect(page.locator("#last-submission")).toHaveText(
    "Ayudame a escribirle a [PERSON_NAME]. Su email es [EMAIL_CONTACT].",
  );
  await expect(page.locator("body[data-submit-count]")).toHaveAttribute(
    "data-submit-count",
    "1",
  );
});

test("private key fixture remains blocked", async ({ context }) => {
  const page = await openFixture(context);
  await page
    .locator("#prompt-textarea")
    .fill(
      "-----BEGIN PRIVATE KEY-----\nfixture-invalid\n-----END PRIVATE KEY-----",
    );

  await page.locator("#prompt-textarea").press("Enter");

  await expect(
    page.getByRole("heading", { name: "Este mensaje no puede salir" }),
  ).toBeVisible();
  await expect(page.locator("body[data-submit-count]")).toHaveAttribute(
    "data-submit-count",
    "0",
  );
});

test("confidential financial prompt warns and anonymizes amounts", async ({
  context,
}) => {
  const page = await openFixture(context);
  await page
    .locator("#prompt-textarea")
    .fill(
      "Nuestro margen interno para Cliente ACME es 47% y pensamos bajar el precio a USD 80.000. Esta información todavía no fue anunciada.",
    );

  await page.locator("#prompt-textarea").press("Enter");
  await expect(
    page.getByRole("heading", { name: "Encontré datos sensibles" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Anonimizar y enviar" }).click();

  await expect(page.locator("#last-submission")).toHaveText(
    "Nuestro margen interno para Cliente ACME es [CONFIDENTIAL_AMOUNT] y pensamos bajar el precio a [CONFIDENTIAL_AMOUNT]. Esta información todavía no fue anunciada.",
  );
});

test("Shift+Enter does not submit and recreated composer remains protected", async ({
  context,
}) => {
  const page = await openFixture(context);
  await page.locator("#prompt-textarea").fill("línea uno");

  await page.locator("#prompt-textarea").press("Shift+Enter");
  await expect(page.locator("body[data-submit-count]")).toHaveAttribute(
    "data-submit-count",
    "0",
  );

  await page.locator("#recreate").click();
  const composer = page.locator('[contenteditable="true"]');
  await composer.fill("Prompt seguro recreado");
  await composer.press("Control+Enter");

  await expect(page.locator("body[data-submit-count]")).toHaveAttribute(
    "data-submit-count",
    "1",
  );
});

test("Ctrl+Enter remains protected when the provider intercepts it on document", async ({
  context,
}) => {
  const page = await openFixture(context);
  await page.locator("body[data-submit-count]").evaluate((body) => {
    body.dataset.blockControlEnter = "true";
  });
  await page.locator("#prompt-textarea").fill("Prompt seguro con Ctrl+Enter");

  await page.locator("#prompt-textarea").press("Control+Enter");

  await expect(page.locator("body[data-submit-count]")).toHaveAttribute(
    "data-submit-count",
    "1",
  );
  await expect(page.locator("#last-submission")).toHaveText(
    "Prompt seguro con Ctrl+Enter",
  );
});
