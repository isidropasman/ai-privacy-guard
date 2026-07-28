import type { BrowserContext, Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { expect, test } from "./extension.fixture";

const fixturePath = path.resolve("tests/fixtures/chatgpt.html");

async function openFixture(context: BrowserContext): Promise<Page> {
  const html = await readFile(fixturePath, "utf8");
  const page = await context.newPage();
  await page.route("https://chatgpt.com/**", async (route) => {
    await route.fulfill({ status: 200, contentType: "text/html", body: html });
  });
  await page.goto("https://chatgpt.com/");
  await expect(page.locator("ai-privacy-guard")).toBeAttached();
  return page;
}

const credentialCorpus = [
  "OPENAI_API_KEY=sk_12312434sdfsef_test_33ddd",
  "export OPENAI_API_KEY = 'sk_fixture_1234567890'",
  "openai_api_key: sk_fixture_1234567890",
  '"OPENAI_API_KEY": "sk_fixture_1234567890"',
  "GITHUB_TOKEN=github_pat_11AA0_fixture_token_1234567890",
  "GITLAB_TOKEN=glpat-fixture-token-1234567890",
  "HF_TOKEN=hf_fixtureToken1234567890",
  "Authorization: Bearer fixtureToken1234567890ABCDE",
  "AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE",
  "STRIPE_SECRET=fixture-secret-value-1234567890",
] as const;

test("blocks a broad credential corpus before any submission", async ({
  context,
}) => {
  test.setTimeout(60_000);

  for (const payload of credentialCorpus) {
    const page = await openFixture(context);
    await page.locator("#prompt-textarea").fill(payload);
    await page.locator("#prompt-textarea").press("Enter");

    await expect(
      page.getByRole("heading", { name: "Este mensaje no puede salir" }),
      `credential escaped protection: ${payload.slice(0, 24)}`,
    ).toBeVisible();
    await expect(page.locator("body[data-submit-count]")).toHaveAttribute(
      "data-submit-count",
      "0",
    );
    await page.close();
  }
});

const benignCorpus = [
  "¿Qué es una API key?",
  "Explicame cómo rotar credenciales sin mostrar ninguna.",
  "La variable OPENAI_API_KEY debe configurarse en el servidor.",
  "Compará OAuth con tokens de acceso.",
  "Escribí una política que prohíba pegar contraseñas.",
  "¿Cómo funciona AWS_ACCESS_KEY_ID?",
  "Usá el placeholder OPENAI_API_KEY en el ejemplo.",
  "Nunca compartas un Bearer token en un chat.",
  "Mostrame un ejemplo usando [API_KEY_REMOVED].",
  "La palabra PASSWORD no es una contraseña.",
] as const;

test("does not block security education without actual secret values", async ({
  context,
}) => {
  test.setTimeout(60_000);

  for (const prompt of benignCorpus) {
    const page = await openFixture(context);
    await page.locator("#prompt-textarea").fill(prompt);
    await page.locator("#prompt-textarea").press("Enter");

    await expect(page.locator("body[data-submit-count]")).toHaveAttribute(
      "data-submit-count",
      "1",
    );
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await page.close();
  }
});

test("coalesces a burst of simultaneous submission attempts", async ({
  context,
}) => {
  const page = await openFixture(context);
  const composer = page.locator("#prompt-textarea");
  const send = page.locator('[data-testid="send-button"]');
  await composer.fill("OPENAI_API_KEY=sk_fixture_1234567890");

  await Promise.all([
    ...Array.from({ length: 10 }, () => send.click({ force: true })),
    ...Array.from({ length: 10 }, () => composer.press("Control+Enter")),
  ]);

  await expect(
    page.getByRole("heading", { name: "Este mensaje no puede salir" }),
  ).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(1);
  await expect(page.locator("body[data-submit-count]")).toHaveAttribute(
    "data-submit-count",
    "0",
  );

  await page.getByRole("button", { name: "Eliminar y continuar" }).click();
  await expect(page.locator("body[data-submit-count]")).toHaveAttribute(
    "data-submit-count",
    "1",
  );
});

test("intercepts a programmatic form requestSubmit", async ({ context }) => {
  const page = await openFixture(context);
  await page
    .locator("#prompt-textarea")
    .fill("OPENAI_API_KEY=sk_fixture_1234567890");

  await page.locator("#composer-form").evaluate((form) => {
    if (!(form instanceof HTMLFormElement)) {
      throw new Error("Expected composer form");
    }
    form.requestSubmit();
  });

  await expect(
    page.getByRole("heading", { name: "Este mensaje no puede salir" }),
  ).toBeVisible();
  await expect(page.locator("body[data-submit-count]")).toHaveAttribute(
    "data-submit-count",
    "0",
  );
});

test("keeps warning text untouched when the user cancels", async ({
  context,
}) => {
  const page = await openFixture(context);
  const original =
    "Ayudame a escribirle a Juan Pérez. Su email es juan.perez@example.com.";
  await page.locator("#prompt-textarea").fill(original);
  await page.locator('[data-testid="send-button"]').click();

  await page.getByRole("button", { name: "Cancelar", exact: true }).click();

  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator("#prompt-textarea")).toHaveValue(original);
  await expect(page.locator("body[data-submit-count]")).toHaveAttribute(
    "data-submit-count",
    "0",
  );
});

test("sends warning text once after explicit original confirmation", async ({
  context,
}) => {
  const page = await openFixture(context);
  const original =
    "Ayudame a escribirle a Juan Pérez. Su email es juan.perez@example.com.";
  await page.locator("#prompt-textarea").fill(original);
  await page.locator('[data-testid="send-button"]').click();

  await page
    .getByRole("button", { name: "Enviar original", exact: true })
    .click();

  await expect(page.locator("#last-submission")).toHaveText(original);
  await expect(page.locator("body[data-submit-count]")).toHaveAttribute(
    "data-submit-count",
    "1",
  );
});

test("survives repeated composer replacement and keyboard submission", async ({
  context,
}) => {
  test.setTimeout(60_000);
  const page = await openFixture(context);

  for (let iteration = 1; iteration <= 20; iteration += 1) {
    await page.locator("#recreate").click();
    const composer = page.locator('[contenteditable="true"]');
    await composer.fill(`Prompt seguro recreado ${iteration}`);
    await composer.press("Control+Enter");
    await expect(page.locator("body[data-submit-count]")).toHaveAttribute(
      "data-submit-count",
      String(iteration),
    );
  }
});

test("keeps the page responsive for a large prompt", async ({ context }) => {
  const page = await openFixture(context);
  const prompt = `${"contexto seguro ".repeat(7_000)}fin`;
  await page.locator("#prompt-textarea").fill(prompt);

  const startedAt = Date.now();
  await page.locator("#prompt-textarea").press("Enter");
  await expect(page.locator("body[data-submit-count]")).toHaveAttribute(
    "data-submit-count",
    "1",
    { timeout: 5_000 },
  );

  expect(Date.now() - startedAt).toBeLessThan(5_000);
});

test("keeps mascot help stable across repeated toggles", async ({
  context,
}) => {
  const page = await openFixture(context);
  const trigger = page.getByRole("button", {
    name: "¿Qué hace Security Genie?",
  });

  for (let iteration = 0; iteration < 25; iteration += 1) {
    await trigger.click();
    await expect(
      page.getByRole("heading", { name: "¿Por qué estoy acá?" }),
    ).toBeVisible();
    await trigger.click();
    await expect(
      page.getByRole("heading", { name: "¿Por qué estoy acá?" }),
    ).toHaveCount(0);
  }
});
