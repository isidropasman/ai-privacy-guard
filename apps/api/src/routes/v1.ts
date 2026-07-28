import { Router, type Request, type Response } from "express";
import {
  parseEnrollRequest,
  parseEventBatch,
  parseHeartbeat,
  parseTelemetryEvent,
} from "../../../../packages/contracts/src/index";
import { createOpaqueToken, hashToken } from "../auth";
import type { SqlClient } from "../db/client";

interface Installation {
  readonly id: string;
  readonly company_id: string;
  readonly user_id: string;
}

const enrollWindowMs = 10 * 60 * 1000;
const maxEnrollAttempts = 20;

export function createV1Router(client: SqlClient): Router {
  const router = Router();

  // CORS abierto sólo acá: la extensión es cross-origin y su ID varía entre
  // instalaciones descomprimidas, así que no puede allowlistearse. No se
  // habilitan credenciales porque la autenticación viaja en el header Bearer.
  router.use((request, response, next) => {
    response.setHeader("Access-Control-Allow-Origin", "*");
    response.setHeader(
      "Access-Control-Allow-Headers",
      "content-type,authorization",
    );
    response.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
    if (request.method === "OPTIONS") {
      response.status(204).end();
      return;
    }
    next();
  });

  router.post("/enroll", (request, response) => {
    void handleEnroll(client, request, response);
  });

  router.post("/events", (request, response) => {
    void withInstallation(client, request, response, (installation) =>
      handleEvents(client, installation, request, response),
    );
  });

  router.post("/heartbeat", (request, response) => {
    void withInstallation(client, request, response, (installation) =>
      handleHeartbeat(client, installation, request, response),
    );
  });

  router.post("/unenroll", (request, response) => {
    void withInstallation(client, request, response, async (installation) => {
      await client.query(
        `update installations set status = 'revoked' where id = $1`,
        [installation.id],
      );
      response.status(204).end();
    });
  });

  return router;
}

async function handleEnroll(
  client: SqlClient,
  request: Request,
  response: Response,
): Promise<void> {
  const ip = clientIp(request);
  if (await isRateLimited(client, ip)) {
    response
      .status(429)
      .json({ error: "Demasiados intentos. Probá más tarde." });
    return;
  }

  const parsed = parseEnrollRequest(request.body);
  if (!parsed.ok) {
    await recordAttempt(client, ip, false);
    response.status(400).json({ error: parsed.error });
    return;
  }

  const companies = await client.query<{ company_id: string }>(
    `select company_id from enrollment_codes
      where code = $1 and revoked_at is null`,
    [parsed.value.code],
  );
  const company = companies[0];
  if (company === undefined) {
    await recordAttempt(client, ip, false);
    response.status(404).json({ error: "Código de enrolamiento inválido." });
    return;
  }

  const companyRows = await client.query<{ id: string; name: string }>(
    `select id, name from companies where id = $1`,
    [company.company_id],
  );
  const companyRow = companyRows[0];
  if (companyRow === undefined) {
    response.status(404).json({ error: "Empresa inexistente." });
    return;
  }

  const users = await client.query<{ id: string }>(
    `insert into users (company_id, email)
     values ($1, $2)
     on conflict (company_id, email) do update set email = excluded.email
     returning id`,
    [companyRow.id, parsed.value.email],
  );
  const user = users[0];
  if (user === undefined) {
    response.status(500).json({ error: "No se pudo crear el usuario." });
    return;
  }

  const token = createOpaqueToken();
  const installations = await client.query<{ id: string }>(
    `insert into installations
       (company_id, user_id, token_hash, extension_version)
     values ($1, $2, $3, $4)
     returning id`,
    [companyRow.id, user.id, hashToken(token), parsed.value.extensionVersion],
  );
  const installation = installations[0];
  if (installation === undefined) {
    response.status(500).json({ error: "No se pudo crear la instalación." });
    return;
  }

  await recordAttempt(client, ip, true);
  response.status(201).json({
    installationId: installation.id,
    token,
    company: { id: companyRow.id, name: companyRow.name },
    userEmail: parsed.value.email,
  });
}

async function handleEvents(
  client: SqlClient,
  installation: Installation,
  request: Request,
  response: Response,
): Promise<void> {
  const batch = parseEventBatch(request.body);
  if (!batch.ok) {
    response.status(400).json({ error: batch.error });
    return;
  }

  let accepted = 0;
  const rejected: { id: string; reason: string }[] = [];

  for (const raw of batch.value.events) {
    const parsed = parseTelemetryEvent(raw);
    if (!parsed.ok) {
      const id =
        typeof raw === "object" && raw !== null && "id" in raw
          ? String((raw as { id: unknown }).id)
          : "desconocido";
      rejected.push({ id, reason: parsed.error });
      continue;
    }

    const event = parsed.value;
    // `on conflict do nothing` es lo que hace idempotente al reintento: el
    // mismo id reenviado tras un timeout no duplica el evento.
    const inserted = await client.query<{ id: string }>(
      `insert into events
         (id, company_id, installation_id, user_id, occurred_at, provider,
          decision, resolution, top_severity, score, duration_ms)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       on conflict (id) do nothing
       returning id`,
      [
        event.id,
        installation.company_id,
        installation.id,
        installation.user_id,
        event.occurredAt,
        event.provider,
        event.decision,
        event.resolution,
        event.topSeverity,
        event.score,
        event.durationMs,
      ],
    );

    if (inserted.length > 0) {
      for (const rule of event.rules) {
        await client.query(
          `insert into event_rules
             (event_id, rule_id, rule_source, category, severity)
           values ($1, $2, $3, $4, $5)
           on conflict (event_id, rule_id) do nothing`,
          [
            event.id,
            rule.ruleId,
            rule.ruleSource,
            rule.category,
            rule.severity,
          ],
        );
      }
    }

    accepted += 1;
  }

  await touchInstallation(client, installation.id);
  response.status(200).json({ accepted, rejected });
}

async function handleHeartbeat(
  client: SqlClient,
  installation: Installation,
  request: Request,
  response: Response,
): Promise<void> {
  const parsed = parseHeartbeat(request.body);
  if (!parsed.ok) {
    response.status(400).json({ error: parsed.error });
    return;
  }

  const { counters, extensionVersion } = parsed.value;
  await client.query(
    `insert into heartbeats
       (installation_id, extension_version, analyzed_count, allowed_count,
        warned_count, blocked_count, redacted_count, dropped_count)
     values ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      installation.id,
      extensionVersion,
      counters.analyzedCount,
      counters.allowedCount,
      counters.warnedCount,
      counters.blockedCount,
      counters.redactedCount,
      counters.droppedCount,
    ],
  );

  await client.query(
    `update installations set extension_version = $2 where id = $1`,
    [installation.id, extensionVersion],
  );
  await touchInstallation(client, installation.id);
  response.status(204).end();
}

async function withInstallation(
  client: SqlClient,
  request: Request,
  response: Response,
  handler: (installation: Installation) => Promise<void>,
): Promise<void> {
  const header = request.header("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (token.length === 0) {
    response.status(401).json({ error: "Falta el token de instalación." });
    return;
  }

  const rows = await client.query<Installation>(
    `select id, company_id, user_id from installations
      where token_hash = $1 and status = 'active'`,
    [hashToken(token)],
  );
  const installation = rows[0];
  if (installation === undefined) {
    response.status(401).json({ error: "Instalación no válida o revocada." });
    return;
  }

  await handler(installation);
}

async function touchInstallation(
  client: SqlClient,
  installationId: string,
): Promise<void> {
  await client.query(
    `update installations set last_seen_at = now() where id = $1`,
    [installationId],
  );
}

function clientIp(request: Request): string {
  const forwarded = request.header("x-forwarded-for");
  if (forwarded !== undefined && forwarded.length > 0) {
    return forwarded.split(",")[0]?.trim() ?? "desconocida";
  }
  return request.ip ?? "desconocida";
}

async function isRateLimited(client: SqlClient, ip: string): Promise<boolean> {
  const since = new Date(Date.now() - enrollWindowMs).toISOString();
  const rows = await client.query<{ count: string }>(
    `select count(*)::text as count from enroll_attempts
      where ip = $1 and succeeded = false and attempted_at > $2`,
    [ip, since],
  );
  return Number(rows[0]?.count ?? "0") >= maxEnrollAttempts;
}

async function recordAttempt(
  client: SqlClient,
  ip: string,
  succeeded: boolean,
): Promise<void> {
  await client.query(
    `insert into enroll_attempts (ip, succeeded) values ($1, $2)`,
    [ip, succeeded],
  );
}
