import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { createApp } from "../../apps/api/src/app";
import { hashPassword } from "../../apps/api/src/auth";
import type { ApiConfig } from "../../apps/api/src/config";
import {
  createSqlClient,
  migrate,
  type SqlClient,
} from "../../apps/api/src/db/client";
import { seed } from "../../apps/api/src/db/seed";

const password = "test-password";
const code = "ANDE-7F3K-2NQ8";

let client: SqlClient;
let server: Server;
let baseUrl: string;

function config(): ApiConfig {
  return {
    port: 0,
    databaseUrl: undefined,
    passwordHash: hashPassword(password),
    secureCookies: false,
    extensionDir: "/directorio/inexistente",
    publicApiBaseUrl: "http://localhost:8787",
    dashboardDir: "/directorio/inexistente",
  };
}

beforeAll(async () => {
  client = await createSqlClient(undefined);
  await migrate(client);
  await seed(client);

  const app = createApp(client, config());
  server = await new Promise<Server>((resolve) => {
    const listening = app.listen(0, () => {
      resolve(listening);
    });
  });
  baseUrl = `http://127.0.0.1:${String((server.address() as AddressInfo).port)}`;
}, 60_000);

afterAll(async () => {
  await new Promise<void>((resolve) =>
    server.close(() => {
      resolve();
    }),
  );
  await client.close();
});

async function enroll(email: string): Promise<string> {
  const response = await fetch(`${baseUrl}/v1/enroll`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ code, email, extensionVersion: "0.1.0" }),
  });
  const body = (await response.json()) as { token: string };
  return body.token;
}

function sampleEvent(id: string) {
  return {
    id,
    occurredAt: "2026-07-28T18:00:00.000Z",
    provider: "ChatGPT",
    decision: "BLOCK",
    resolution: "redacted",
    topSeverity: "critical",
    score: 100,
    durationMs: 25,
    rules: [
      {
        ruleId: "api-key",
        ruleSource: "base",
        category: "credential",
        severity: "critical",
      },
    ],
  };
}

async function login(): Promise<string> {
  const response = await fetch(`${baseUrl}/admin/session`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ password }),
  });
  return response.headers.get("set-cookie")?.split(";")[0] ?? "";
}

describe("enrolamiento", () => {
  test("un código válido devuelve token y empresa", async () => {
    const response = await fetch(`${baseUrl}/v1/enroll`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        code,
        email: "Nuevo.Usuario@AndesFintech.com",
        extensionVersion: "0.1.0",
      }),
    });

    expect(response.status).toBe(201);
    const body = (await response.json()) as {
      token: string;
      company: { id: string };
      userEmail: string;
    };
    expect(body.company.id).toBe("andes-fintech");
    expect(body.userEmail).toBe("nuevo.usuario@andesfintech.com");
    expect(body.token.length).toBeGreaterThan(20);
  });

  test("un código inexistente devuelve 404", async () => {
    const response = await fetch(`${baseUrl}/v1/enroll`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        code: "NOPE-NOPE-NOPE",
        email: "a@b.com",
        extensionVersion: "0.1.0",
      }),
    });

    expect(response.status).toBe(404);
  });

  test("un email inválido devuelve 400", async () => {
    const response = await fetch(`${baseUrl}/v1/enroll`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        code,
        email: "no-es-un-email",
        extensionVersion: "0.1.0",
      }),
    });

    expect(response.status).toBe(400);
  });
});

describe("ingesta", () => {
  test("acepta un lote y lo deja visible para el dashboard", async () => {
    const token = await enroll("ingesta@andesfintech.com");

    const response = await fetch(`${baseUrl}/v1/events`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ events: [sampleEvent("evt-ingesta-1")] }),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ accepted: 1, rejected: [] });

    const cookie = await login();
    const read = await fetch(
      `${baseUrl}/admin/companies/andes-fintech/events`,
      { headers: { cookie } },
    );
    const body = (await read.json()) as {
      events: { id: string; user_email: string; rules: unknown[] }[];
    };
    const found = body.events.find((event) => event.id === "evt-ingesta-1");

    expect(found?.user_email).toBe("ingesta@andesfintech.com");
    expect(found?.rules).toHaveLength(1);
  });

  test("reenviar el mismo id no duplica el evento", async () => {
    const token = await enroll("idempotencia@andesfintech.com");
    const send = () =>
      fetch(`${baseUrl}/v1/events`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ events: [sampleEvent("evt-duplicado")] }),
      });

    await send();
    await send();
    await send();

    const rows = await client.query<{ count: string }>(
      `select count(*)::text as count from events where id = $1`,
      ["evt-duplicado"],
    );
    expect(rows[0]?.count).toBe("1");
  });

  test("un evento malformado se rechaza sin tumbar el lote", async () => {
    const token = await enroll("parcial@andesfintech.com");

    const response = await fetch(`${baseUrl}/v1/events`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        events: [
          sampleEvent("evt-bueno"),
          { id: "evt-malo", provider: "ChatGPT" },
        ],
      }),
    });

    const body = (await response.json()) as {
      accepted: number;
      rejected: { id: string }[];
    };
    expect(body.accepted).toBe(1);
    expect(body.rejected).toHaveLength(1);
    expect(body.rejected[0]?.id).toBe("evt-malo");
  });

  test("sin token válido responde 401", async () => {
    const response = await fetch(`${baseUrl}/v1/events`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: "Bearer token-inventado",
      },
      body: JSON.stringify({ events: [sampleEvent("evt-sin-auth")] }),
    });

    expect(response.status).toBe(401);
  });

  test("una instalación revocada deja de ser aceptada", async () => {
    const token = await enroll("revocada@andesfintech.com");

    await fetch(`${baseUrl}/v1/unenroll`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}` },
    });

    const response = await fetch(`${baseUrl}/v1/events`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ events: [sampleEvent("evt-revocado")] }),
    });

    expect(response.status).toBe(401);
  });
});

describe("heartbeat", () => {
  test("registra los contadores acumulados", async () => {
    const token = await enroll("heartbeat@andesfintech.com");

    const response = await fetch(`${baseUrl}/v1/heartbeat`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        counters: {
          analyzedCount: 30,
          allowedCount: 25,
          warnedCount: 3,
          blockedCount: 2,
          redactedCount: 2,
          droppedCount: 0,
        },
        extensionVersion: "0.1.0",
      }),
    });

    expect(response.status).toBe(204);
    const rows = await client.query<{ analyzed_count: string }>(
      `select analyzed_count::text from heartbeats order by id desc limit 1`,
    );
    expect(rows[0]?.analyzed_count).toBe("30");
  });
});

describe("consola de super-admin", () => {
  test("sin sesión los endpoints del dashboard responden 401", async () => {
    const response = await fetch(`${baseUrl}/admin/companies`);
    expect(response.status).toBe(401);
  });

  test("una contraseña incorrecta no crea sesión", async () => {
    const response = await fetch(`${baseUrl}/admin/session`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password: "incorrecta" }),
    });
    expect(response.status).toBe(401);
  });

  test("con sesión se listan las 8 empresas del seed", async () => {
    const cookie = await login();
    const response = await fetch(`${baseUrl}/admin/companies`, {
      headers: { cookie },
    });
    const body = (await response.json()) as { companies: unknown[] };

    expect(response.status).toBe(200);
    expect(body.companies).toHaveLength(8);
  });

  test("la descarga del paquete exige sesión", async () => {
    const response = await fetch(
      `${baseUrl}/admin/companies/andes-fintech/extension/download`,
    );
    expect(response.status).toBe(401);
  });

  test("rotar el código invalida el viejo pero no las instalaciones", async () => {
    const token = await enroll("rotacion@andesfintech.com");
    const cookie = await login();

    await fetch(
      `${baseUrl}/admin/companies/andes-fintech/enrollment-code/rotate`,
      { method: "POST", headers: { cookie } },
    );

    const enrollWithOldCode = await fetch(`${baseUrl}/v1/enroll`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        code,
        email: "tarde@andesfintech.com",
        extensionVersion: "0.1.0",
      }),
    });
    expect(enrollWithOldCode.status).toBe(404);

    const stillWorks = await fetch(`${baseUrl}/v1/events`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ events: [sampleEvent("evt-post-rotacion")] }),
    });
    expect(stillWorks.status).toBe(200);
  });
});
