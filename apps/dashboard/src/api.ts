import type {
  Company,
  CompanyUser,
  CustomRule,
  Installation,
  InterceptionEvent,
} from "./types";

/**
 * En desarrollo el dashboard corre en Vite y las rutas se proxean al API, así
 * que siempre son del mismo origen: no hay CORS y la cookie de sesión viaja
 * sola.
 */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<Value>(
  path: string,
  init?: RequestInit,
): Promise<Value> {
  const headers = new Headers(init?.headers);
  if (init?.body !== undefined && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  const response = await fetch(path, { ...init, headers });

  if (response.status === 204) return undefined as Value;

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    body = undefined;
  }

  if (!response.ok) {
    const message =
      typeof body === "object" && body !== null && "error" in body
        ? String(body.error)
        : `Error ${String(response.status)}`;
    throw new ApiError(message, response.status);
  }

  return body as Value;
}

export const api = {
  async login(password: string): Promise<void> {
    await request("/admin/session", {
      method: "POST",
      body: JSON.stringify({ password }),
    });
  },

  async logout(): Promise<void> {
    await request("/admin/session", { method: "DELETE" });
  },

  async me(): Promise<void> {
    await request("/admin/me");
  },

  async companies(): Promise<readonly Company[]> {
    const body = await request<{ companies: readonly Company[] }>(
      "/admin/companies",
    );
    return body.companies;
  },

  async users(companyId: string): Promise<readonly CompanyUser[]> {
    const body = await request<{ users: readonly UserRow[] }>(
      `/admin/companies/${encodeURIComponent(companyId)}/users`,
    );
    return body.users.map(toUser);
  },

  async installations(companyId: string): Promise<readonly Installation[]> {
    const body = await request<{ installations: readonly InstallationRow[] }>(
      `/admin/companies/${encodeURIComponent(companyId)}/installations`,
    );
    return body.installations.map(toInstallation);
  },

  async companyEvents(
    companyId: string,
    filters: Readonly<Record<string, string>> = {},
  ): Promise<readonly InterceptionEvent[]> {
    const query = new URLSearchParams(filters).toString();
    const body = await request<{ events: readonly EventRow[] }>(
      `/admin/companies/${encodeURIComponent(companyId)}/events${
        query.length === 0 ? "" : `?${query}`
      }`,
    );
    return body.events.map(toEvent);
  },

  async events(
    filters: Readonly<Record<string, string>> = {},
  ): Promise<readonly InterceptionEvent[]> {
    const query = new URLSearchParams(filters).toString();
    const body = await request<{ events: readonly EventRow[] }>(
      `/admin/events${query.length === 0 ? "" : `?${query}`}`,
    );
    return body.events.map(toEvent);
  },

  async rules(companyId: string): Promise<readonly CustomRule[]> {
    const body = await request<{ rules: readonly RuleRow[] }>(
      `/admin/companies/${encodeURIComponent(companyId)}/rules`,
    );
    return body.rules.map(toRule);
  },

  async createRule(companyId: string, rule: RulePayload): Promise<CustomRule> {
    const body = await request<{ rule: RuleRow }>(
      `/admin/companies/${encodeURIComponent(companyId)}/rules`,
      { method: "POST", body: JSON.stringify(rule) },
    );
    return toRule(body.rule);
  },

  async updateRule(
    companyId: string,
    ruleId: string,
    rule: RulePayload,
  ): Promise<CustomRule> {
    const body = await request<{ rule: RuleRow }>(
      `/admin/companies/${encodeURIComponent(companyId)}/rules/${encodeURIComponent(ruleId)}`,
      { method: "PATCH", body: JSON.stringify(rule) },
    );
    return toRule(body.rule);
  },

  async rotateCode(companyId: string): Promise<string> {
    const body = await request<{ code: string }>(
      `/admin/companies/${encodeURIComponent(companyId)}/enrollment-code/rotate`,
      { method: "POST" },
    );
    return body.code;
  },

  downloadUrl(companyId: string): string {
    return `/admin/companies/${encodeURIComponent(companyId)}/extension/download`;
  },
};

export interface RulePayload {
  readonly name: string;
  readonly description: string;
  readonly keywords: readonly string[];
  readonly severity: string;
  readonly action: string;
  readonly enabled: boolean;
}

/**
 * El API devuelve las filas tal como salen de Postgres. La traducción a
 * camelCase vive acá y no en los componentes, para que la forma de la base no
 * se filtre a toda la UI.
 */
interface UserRow {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly area: string;
  readonly role: CompanyUser["role"];
  readonly status: CompanyUser["status"];
  readonly installation_count: number;
  readonly event_count: number;
  readonly last_seen_at: string | null;
}

function toUser(row: UserRow): CompanyUser {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    area: row.area,
    role: row.role,
    status: row.status,
    installations: row.installation_count,
    events: row.event_count,
    lastSeenAt: row.last_seen_at,
  };
}

interface InstallationRow {
  readonly id: string;
  readonly user_email: string;
  readonly extension_version: string;
  readonly status: string;
  readonly enrolled_at: string;
  readonly last_seen_at: string | null;
}

function toInstallation(row: InstallationRow): Installation {
  return {
    id: row.id,
    userEmail: row.user_email,
    extensionVersion: row.extension_version,
    status: row.status,
    enrolledAt: row.enrolled_at,
    lastSeenAt: row.last_seen_at,
  };
}

interface EventRow {
  readonly id: string;
  readonly company_id: string;
  readonly company_name: string;
  readonly occurred_at: string;
  readonly received_at: string;
  readonly user_id: string;
  readonly user_email: string;
  readonly provider: string;
  readonly decision: InterceptionEvent["decision"];
  readonly resolution: InterceptionEvent["resolution"];
  readonly top_severity: InterceptionEvent["topSeverity"];
  readonly score: number;
  readonly duration_ms: number;
  readonly rules: InterceptionEvent["rules"];
}

function toEvent(row: EventRow): InterceptionEvent {
  return {
    id: row.id,
    companyId: row.company_id,
    companyName: row.company_name,
    occurredAt: row.occurred_at,
    receivedAt: row.received_at,
    userId: row.user_id,
    userEmail: row.user_email,
    provider: row.provider,
    decision: row.decision,
    resolution: row.resolution,
    topSeverity: row.top_severity,
    score: row.score,
    durationMs: row.duration_ms,
    rules: row.rules,
  };
}

interface RuleRow {
  readonly id: string;
  readonly company_id: string;
  readonly name: string;
  readonly description: string;
  readonly keywords: readonly string[];
  readonly severity: CustomRule["severity"];
  readonly action: CustomRule["action"];
  readonly enabled: boolean;
  readonly created_at: string;
  readonly updated_at: string;
}

function toRule(row: RuleRow): CustomRule {
  return {
    id: row.id,
    companyId: row.company_id,
    name: row.name,
    description: row.description,
    keywords: row.keywords,
    severity: row.severity,
    action: row.action,
    enabled: row.enabled,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
