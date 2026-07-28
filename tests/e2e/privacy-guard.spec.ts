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
  await page
    .locator("#prompt-textarea")
    .fill("Explicame de manera sencilla qué es Kubernetes.");

  await page.locator("#prompt-textarea").press("Enter");

  await expect(page.locator("body[data-submit-count]")).toHaveAttribute(
    "data-submit-count",
    "1",
  );
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("critical credential is blocked and redacted before one send", async ({
  context,
}) => {
  const page = await openFixture(context);
  await page
    .locator("#prompt-textarea")
    .fill("OPENAI_API_KEY=sk-proj-example-for-testing");

  await page.locator("#prompt-textarea").press("Enter");

  await expect(
    page.getByRole("heading", { name: "Envío bloqueado" }),
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
    page.getByRole("heading", { name: "Encontramos información sensible" }),
  ).toBeVisible();
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
    page.getByRole("heading", { name: "Envío bloqueado" }),
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
    page.getByRole("heading", { name: "Encontramos información sensible" }),
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
