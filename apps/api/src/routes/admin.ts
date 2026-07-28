import {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import {
  buildClearedSessionCookie,
  buildSessionCookie,
  createSession,
  isSessionValid,
  parseCookies,
  revokeSession,
  sessionCookieName,
  verifyPassword,
} from "../auth";
import type { SqlClient } from "../db/client";
import { buildCompanyPackage } from "../packaging";
import type { ApiConfig } from "../config";

interface CompanyRow {
  readonly id: string;
  readonly name: string;
  readonly domain: string;
  readonly industry: string;
  readonly plan: string;
  readonly status: string;
  readonly seats: number;
  readonly created_at: string;
  readonly enrollment_code: string | null;
  readonly user_count: string;
  readonly installation_count: string;
  readonly stale_installation_count: string;
  readonly event_count: string;
  readonly blocked_count: string;
  readonly rule_count: string;
  readonly active_rule_count: string;
  readonly last_event_at: string | null;
}

export function createAdminRouter(
  client: SqlClient,
  config: ApiConfig,
): Router {
  const router = Router();

  router.post("/session", (request, response) => {
    void (async () => {
      const body: unknown = request.body;
      const password =
        typeof body === "object" && body !== null && "password" in body
          ? String(body.password)
          : "";

      if (!verifyPassword(password, config.passwordHash)) {
        response.status(401).json({ error: "Contraseña incorrecta." });
        return;
      }

      const token = await createSession(client);
      response.setHeader(
        "Set-Cookie",
        buildSessionCookie(token, config.secureCookies),
      );
      response.status(201).json({ ok: true });
    })();
  });

  router.delete("/session", (request, response) => {
    void (async () => {
      const token = parseCookies(request.header("cookie")).get(
        sessionCookieName,
      );
      if (token !== undefined) await revokeSession(client, token);
      response.setHeader(
        "Set-Cookie",
        buildClearedSessionCookie(config.secureCookies),
      );
      response.status(204).end();
    })();
  });

  router.use((request, response, next) => {
    void requireSession(client, request, response, next);
  });

  router.get("/me", (_request, response) => {
    response.json({ role: "super-admin" });
  });

  router.get("/companies", (_request, response) => {
    void (async () => {
      const rows = await client.query<CompanyRow>(companyMetricsQuery, [null]);
      response.json({ companies: rows.map(toCompany) });
    })();
  });

  router.get("/companies/:id", (request, response) => {
    void (async () => {
      const rows = await client.query<CompanyRow>(companyMetricsQuery, [
        request.params.id,
      ]);
      const found = rows[0];
      if (found === undefined) {
        response.status(404).json({ error: "Empresa inexistente." });
        return;
      }
      response.json({ company: toCompany(found) });
    })();
  });

  router.get("/companies/:id/users", (request, response) => {
    void (async () => {
      const rows = await client.query(
        `select u.id, u.email, u.name, u.area, u.role, u.status, u.created_at,
                (select count(*) from installations i
                  where i.user_id = u.id and i.status = 'active')::int
                  as installation_count,
                (select count(*) from events e where e.user_id = u.id)::int
                  as event_count,
                (select max(i.last_seen_at) from installations i
                  where i.user_id = u.id) as last_seen_at
           from users u
          where u.company_id = $1
          order by u.email`,
        [request.params.id],
      );
      response.json({ users: rows });
    })();
  });

  router.get("/companies/:id/installations", (request, response) => {
    void (async () => {
      const rows = await client.query(
        `select i.id, i.extension_version, i.status, i.enrolled_at,
                i.last_seen_at, u.email as user_email
           from installations i
           join users u on u.id = i.user_id
          where i.company_id = $1
          order by i.enrolled_at desc`,
        [request.params.id],
      );
      response.json({ installations: rows });
    })();
  });

  router.get("/companies/:id/events", (request, response) => {
    void (async () => {
      const events = await queryEvents(client, {
        companyId: request.params.id,
        severity: stringParam(request.query.severity),
        userId: stringParam(request.query.userId),
        provider: stringParam(request.query.provider),
        limit: numberParam(request.query.limit, 200),
      });
      response.json({ events });
    })();
  });

  router.get("/events", (request, response) => {
    void (async () => {
      const events = await queryEvents(client, {
        companyId: stringParam(request.query.companyId),
        severity: stringParam(request.query.severity),
        source: stringParam(request.query.source),
        limit: numberParam(request.query.limit, 200),
      });
      response.json({ events });
    })();
  });

  router.post("/companies/:id/enrollment-code/rotate", (request, response) => {
    void (async () => {
      const companyId = request.params.id;
      // Rotar no desconecta instalaciones existentes: sus tokens siguen
      // siendo válidos. Sólo impide enrolar nuevas con el código viejo.
      await client.query(
        `update enrollment_codes set revoked_at = now()
          where company_id = $1 and revoked_at is null`,
        [companyId],
      );
      const code = generateEnrollmentCode(companyId);
      await client.query(
        `insert into enrollment_codes (code, company_id) values ($1, $2)`,
        [code, companyId],
      );
      response.status(201).json({ code });
    })();
  });

  router.get("/companies/:id/extension/download", (request, response) => {
    void (async () => {
      const rows = await client.query<{
        id: string;
        name: string;
        code: string | null;
      }>(
        `select c.id, c.name,
                (select code from enrollment_codes ec
                  where ec.company_id = c.id and ec.revoked_at is null
                  order by created_at desc limit 1) as code
           from companies c where c.id = $1`,
        [request.params.id],
      );
      const company = rows[0];
      if (company === undefined) {
        response.status(404).json({ error: "Empresa inexistente." });
        return;
      }
      if (company.code === null) {
        response.status(409).json({
          error: "La empresa no tiene código de enrolamiento activo.",
        });
        return;
      }

      try {
        const archive = await buildCompanyPackage({
          extensionDir: config.extensionDir,
          apiBaseUrl: config.publicApiBaseUrl,
          companyId: company.id,
          companyName: company.name,
          enrollmentCode: company.code,
        });
        response.setHeader("Content-Type", "application/zip");
        response.setHeader(
          "Content-Disposition",
          `attachment; filename="ai-privacy-guard-${company.id}.zip"`,
        );
        response.send(archive);
      } catch (error) {
        response.status(503).json({
          error:
            "No hay build de la extensión disponible. Corré `pnpm build` antes de descargar.",
          detail: error instanceof Error ? error.message : String(error),
        });
      }
    })();
  });

  router.get("/companies/:id/rules", (request, response) => {
    void (async () => {
      const rules = await client.query(
        `select id, company_id, name, description, keywords, severity, action,
                enabled, created_at, updated_at
           from custom_rules where company_id = $1 order by created_at desc`,
        [request.params.id],
      );
      response.json({ rules });
    })();
  });

  router.post("/companies/:id/rules", (request, response) => {
    void (async () => {
      const rule = parseRuleBody(request.body);
      if (rule === null) {
        response.status(400).json({ error: "Regla inválida." });
        return;
      }
      const rows = await client.query(
        `insert into custom_rules
           (company_id, name, description, keywords, severity, action, enabled)
         values ($1, $2, $3, $4::jsonb, $5, $6, $7)
         returning id, company_id, name, description, keywords, severity,
                   action, enabled, created_at, updated_at`,
        [
          request.params.id,
          rule.name,
          rule.description,
          JSON.stringify(rule.keywords),
          rule.severity,
          rule.action,
          rule.enabled,
        ],
      );
      response.status(201).json({ rule: rows[0] });
    })();
  });

  router.patch("/companies/:id/rules/:ruleId", (request, response) => {
    void (async () => {
      const rule = parseRuleBody(request.body);
      if (rule === null) {
        response.status(400).json({ error: "Regla inválida." });
        return;
      }
      const rows = await client.query(
        `update custom_rules
            set name = $3, description = $4, keywords = $5::jsonb,
                severity = $6, action = $7, enabled = $8, updated_at = now()
          where company_id = $1 and id = $2
         returning id, company_id, name, description, keywords, severity,
                   action, enabled, created_at, updated_at`,
        [
          request.params.id,
          request.params.ruleId,
          rule.name,
          rule.description,
          JSON.stringify(rule.keywords),
          rule.severity,
          rule.action,
          rule.enabled,
        ],
      );
      if (rows.length === 0) {
        response.status(404).json({ error: "Regla inexistente." });
        return;
      }
      response.json({ rule: rows[0] });
    })();
  });

  router.delete("/companies/:id/rules/:ruleId", (request, response) => {
    void (async () => {
      await client.query(
        `delete from custom_rules where company_id = $1 and id = $2`,
        [request.params.id, request.params.ruleId],
      );
      response.status(204).end();
    })();
  });

  return router;
}

async function requireSession(
  client: SqlClient,
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  const token = parseCookies(request.header("cookie")).get(sessionCookieName);
  if (token === undefined || !(await isSessionValid(client, token))) {
    response.status(401).json({ error: "Sesión requerida." });
    return;
  }
  next();
}

const companyMetricsQuery = `
  select c.id, c.name, c.domain, c.industry, c.plan, c.status, c.seats,
         c.created_at,
         (select code from enrollment_codes ec
           where ec.company_id = c.id and ec.revoked_at is null
           order by created_at desc limit 1) as enrollment_code,
         (select count(*) from users u where u.company_id = c.id)::text
           as user_count,
         (select count(*) from installations i
           where i.company_id = c.id and i.status = 'active')::text
           as installation_count,
         (select count(*) from installations i
           where i.company_id = c.id and i.status = 'active'
             and (i.last_seen_at is null
                  or i.last_seen_at < now() - interval '7 days'))::text
           as stale_installation_count,
         (select count(*) from events e where e.company_id = c.id)::text
           as event_count,
         (select count(*) from events e
           where e.company_id = c.id and e.resolution = 'blocked')::text
           as blocked_count,
         (select count(*) from custom_rules r where r.company_id = c.id)::text
           as rule_count,
         (select count(*) from custom_rules r
           where r.company_id = c.id and r.enabled)::text as active_rule_count,
         (select max(occurred_at) from events e where e.company_id = c.id)
           as last_event_at
    from companies c
   where ($1::text is null or c.id = $1)
   order by c.name
`;

function toCompany(row: CompanyRow) {
  const users = Number(row.user_count);
  const installations = Number(row.installation_count);
  return {
    id: row.id,
    name: row.name,
    domain: row.domain,
    industry: row.industry,
    plan: row.plan,
    status: row.status,
    seats: row.seats,
    createdAt: row.created_at,
    enrollmentCode: row.enrollment_code,
    metrics: {
      users,
      installations,
      staleInstallations: Number(row.stale_installation_count),
      coverage: users === 0 ? 0 : Math.round((installations / users) * 100),
      events: Number(row.event_count),
      blocked: Number(row.blocked_count),
      rules: Number(row.rule_count),
      activeRules: Number(row.active_rule_count),
      lastEventAt: row.last_event_at,
    },
  };
}

interface EventFilters {
  readonly companyId?: string | undefined;
  readonly severity?: string | undefined;
  readonly userId?: string | undefined;
  readonly provider?: string | undefined;
  readonly source?: string | undefined;
  readonly limit: number;
}

async function queryEvents(client: SqlClient, filters: EventFilters) {
  const conditions: string[] = [];
  const params: unknown[] = [];

  const push = (condition: string, value: unknown) => {
    params.push(value);
    conditions.push(condition.replace("?", `$${params.length}`));
  };

  if (filters.companyId !== undefined)
    push("e.company_id = ?", filters.companyId);
  if (filters.severity !== undefined)
    push("e.top_severity = ?", filters.severity);
  if (filters.userId !== undefined) push("e.user_id = ?", filters.userId);
  if (filters.provider !== undefined) push("e.provider = ?", filters.provider);
  if (filters.source !== undefined) {
    push(
      "exists (select 1 from event_rules r2 where r2.event_id = e.id and r2.rule_source = ?)",
      filters.source,
    );
  }

  params.push(filters.limit);
  const where =
    conditions.length === 0 ? "" : `where ${conditions.join(" and ")}`;

  return client.query(
    `select e.id, e.company_id, e.occurred_at, e.received_at, e.provider,
            e.decision, e.resolution, e.top_severity, e.score, e.duration_ms,
            e.user_id, u.email as user_email, c.name as company_name,
            coalesce(
              json_agg(
                json_build_object(
                  'ruleId', r.rule_id, 'ruleSource', r.rule_source,
                  'category', r.category, 'severity', r.severity
                )
              ) filter (where r.event_id is not null), '[]'
            ) as rules
       from events e
       join users u on u.id = e.user_id
       join companies c on c.id = e.company_id
       left join event_rules r on r.event_id = e.id
       ${where}
      group by e.id, u.email, c.name
      order by e.occurred_at desc
      limit $${params.length}`,
    params,
  );
}

function stringParam(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed === "all") return undefined;
  return trimmed;
}

function numberParam(value: unknown, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, 500);
}

interface RuleBody {
  readonly name: string;
  readonly description: string;
  readonly keywords: readonly string[];
  readonly severity: string;
  readonly action: string;
  readonly enabled: boolean;
}

function parseRuleBody(body: unknown): RuleBody | null {
  if (typeof body !== "object" || body === null) return null;
  const value = body as Record<string, unknown>;

  const name = typeof value.name === "string" ? value.name.trim() : "";
  if (name.length === 0 || name.length > 120) return null;

  const keywords = Array.isArray(value.keywords)
    ? value.keywords.filter(
        (keyword): keyword is string =>
          typeof keyword === "string" && keyword.trim().length > 0,
      )
    : [];
  if (keywords.length === 0) return null;

  const severity = String(value.severity);
  if (!["low", "medium", "high", "critical"].includes(severity)) return null;

  const action = String(value.action);
  if (!["allow", "warn", "replace", "block"].includes(action)) return null;

  return {
    name,
    description:
      typeof value.description === "string" ? value.description.trim() : "",
    keywords: [...new Set(keywords.map((keyword) => keyword.trim()))],
    severity,
    action,
    enabled: value.enabled !== false,
  };
}

const codeAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateEnrollmentCode(companyId: string): string {
  const prefix = companyId
    .replace(/[^a-z]/giu, "")
    .slice(0, 4)
    .toUpperCase()
    .padEnd(4, "X");
  const block = (): string => {
    let result = "";
    for (let index = 0; index < 4; index += 1) {
      const position = Math.floor(Math.random() * codeAlphabet.length);
      result += codeAlphabet[position] ?? "X";
    }
    return result;
  };
  return `${prefix}-${block()}-${block()}`;
}
