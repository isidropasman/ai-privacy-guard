import { chromium, expect, test, type BrowserContext } from "@playwright/test";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import type { Server } from "node:http";
import { tmpdir } from "node:os";
import path from "node:path";
import JSZip from "jszip";
import { createApp } from "../../apps/api/src/app";
import { hashPassword } from "../../apps/api/src/auth";
import type { ApiConfig } from "../../apps/api/src/config";
import {
  createSqlClient,
  migrate,
  type SqlClient,
} from "../../apps/api/src/db/client";
import { seed } from "../../apps/api/src/db/seed";

/**
 * Recorrido completo y real: el super-admin descarga el paquete de una
 * empresa, un empleado lo instala y se enrola, escribe un prompt con una
 * credencial, y el evento aparece en el dashboard sin el prompt.
 *
 * El puerto es fijo porque `host_permissions` del manifest declara
 * http://localhost:8787.
 */
const apiPort = 8787;
const apiUrl = `http://localhost:${String(apiPort)}`;
const password = "e2e-password";
const employeeEmail = "empleado.e2e@andesfintech.com";

let client: SqlClient;
let server: Server;
let extensionDir: string;
let context: BrowserContext;

const fixturePath = path.resolve("tests/fixtures/chatgpt.html");

function config(): ApiConfig {
  return {
    port: apiPort,
    databaseUrl: undefined,
    passwordHash: hashPassword(password),
    secureCookies: false,
    extensionDir: path.resolve(".output/chrome-mv3"),
    publicApiBaseUrl: apiUrl,
    dashboardDir: path.resolve("apps/dashboard/dist"),
  };
}

async function login(): Promise<string> {
  const response = await fetch(`${apiUrl}/admin/session`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ password }),
  });
  return response.headers.get("set-cookie")?.split(";")[0] ?? "";
}

test.beforeAll(async () => {
  test.setTimeout(120_000);

  client = await createSqlClient(undefined);
  await migrate(client);
  await seed(client);

  const app = createApp(client, config());
  server = await new Promise<Server>((resolve, reject) => {
    const listening = app.listen(apiPort, () => {
      resolve(listening);
    });
    // Sin esto, un API de desarrollo ya escuchando en 8787 haría que el test
    // hable con el servidor equivocado y falle con un 401 incomprensible.
    listening.on("error", reject);
  });

  // 1. El super-admin descarga el paquete de Andes Fintech.
  const cookie = await login();
  const download = await fetch(
    `${apiUrl}/admin/companies/andes-fintech/extension/download`,
    { headers: { cookie } },
  );
  expect(download.status).toBe(200);

  // 2. Se descomprime, igual que haría el empleado.
  extensionDir = await mkdtemp(path.join(tmpdir(), "privacy-guard-pkg-"));
  const zip = await JSZip.loadAsync(await download.arrayBuffer());
  for (const [name, entry] of Object.entries(zip.files)) {
    if (entry.dir) continue;
    const target = path.join(extensionDir, name);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, await entry.async("nodebuffer"));
  }

  const injected: unknown = JSON.parse(
    await readFile(path.join(extensionDir, "config.json"), "utf8"),
  );
  expect(injected).toMatchObject({
    companyId: "andes-fintech",
    apiBaseUrl: apiUrl,
  });

  // 3. Se carga descomprimida, como en chrome://extensions.
  context = await chromium.launchPersistentContext("", {
    channel: "chromium",
    headless: true,
    args: [
      `--disable-extensions-except=${extensionDir}`,
      `--load-extension=${extensionDir}`,
    ],
  });
});

test.afterAll(async () => {
  await context.close();
  await new Promise<void>((resolve) => {
    server.close(() => {
      resolve();
    });
  });
  await client.close();
});

test("el paquete de una empresa reporta un evento real sin filtrar el prompt", async () => {
  test.setTimeout(90_000);

  const worker =
    context.serviceWorkers()[0] ??
    (await context.waitForEvent("serviceworker"));
  const extensionId = new URL(worker.url()).host;

  // 4. El empleado se enrola desde la pantalla de bienvenida.
  const welcome = await context.newPage();
  await welcome.goto(`chrome-extension://${extensionId}/welcome.html`);

  // El paquete trae la empresa, así que no se pide el código: sólo el email.
  await expect(welcome.locator(".enrollment-company")).toHaveText(
    "Andes Fintech",
  );
  await expect(welcome.getByLabel("Código de enrolamiento")).toHaveCount(0);

  await welcome.getByLabel("Email corporativo").fill(employeeEmail);
  await welcome.getByRole("button", { name: "Conectar" }).click();
  await expect(
    welcome.getByRole("heading", { name: "Conectado" }),
  ).toBeVisible();

  // 5. Escribe un prompt con una credencial y elige reemplazar.
  const html = await readFile(fixturePath, "utf8");
  const page = await context.newPage();
  await page.route("https://chatgpt.com/**", async (route) => {
    await route.fulfill({ status: 200, contentType: "text/html", body: html });
  });
  await page.goto("https://chatgpt.com/");
  await expect(page.locator("ai-privacy-guard")).toBeAttached();

  await page
    .locator("#prompt-textarea")
    .fill("OPENAI_API_KEY=sk-proj-example-for-testing");
  await page.locator("#prompt-textarea").press("Enter");

  await expect(
    page.getByRole("heading", { name: "Este mensaje no puede salir" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Eliminar y continuar" }).click();
  await expect(page.locator("body[data-submit-count]")).toHaveAttribute(
    "data-submit-count",
    "1",
  );

  // 6. El evento llega al API y el dashboard lo ve.
  const cookie = await login();
  const events = await expect
    .poll(
      async () => {
        const response = await fetch(
          `${apiUrl}/admin/companies/andes-fintech/events`,
          { headers: { cookie } },
        );
        const body = (await response.json()) as { events: unknown[] };
        return body.events.length;
      },
      { timeout: 30_000, intervals: [500] },
    )
    .toBeGreaterThan(0)
    .then(async () => {
      const response = await fetch(
        `${apiUrl}/admin/companies/andes-fintech/events`,
        { headers: { cookie } },
      );
      return (await response.json()) as {
        events: {
          user_email: string;
          provider: string;
          decision: string;
          resolution: string;
          top_severity: string;
          rules: { ruleId: string }[];
        }[];
      };
    });

  const event = events.events[0];
  expect(event?.user_email).toBe(employeeEmail);
  expect(event?.decision).toBe("BLOCK");
  expect(event?.resolution).toBe("redacted");
  expect(event?.top_severity).toBe("critical");
  expect(event?.rules.map((rule) => rule.ruleId)).toContain("api-key");

  // 7. Nada del prompt viajó: ni la credencial ni fragmentos de ella.
  const serialized = JSON.stringify(events);
  expect(serialized).not.toContain("sk-proj");
  expect(serialized).not.toContain("OPENAI_API_KEY");
  expect(serialized).not.toContain("example-for-testing");
});
