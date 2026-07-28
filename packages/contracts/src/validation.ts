import {
  eventResolutions,
  limits,
  policyDecisions,
  ruleSeverities,
  ruleSources,
  type EnrollRequest,
  type EventBatchRequest,
  type EventResolution,
  type HeartbeatRequest,
  type PolicyDecision,
  type RuleSeverity,
  type RuleSource,
  type RuntimeConfig,
  type TelemetryCounters,
  type TelemetryEvent,
  type TelemetryRule,
} from "./types";

export type ParseResult<Value> =
  | { readonly ok: true; readonly value: Value }
  | { readonly ok: false; readonly error: string };

function ok<Value>(value: Value): ParseResult<Value> {
  return { ok: true, value };
}

function fail<Value>(error: string): ParseResult<Value> {
  return { ok: false, error };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function boundedString(
  value: unknown,
  field: string,
  max: number = limits.maxStringLength,
): ParseResult<string> {
  if (typeof value !== "string") return fail(`${field} debe ser string`);
  const trimmed = value.trim();
  if (trimmed.length === 0) return fail(`${field} no puede estar vacío`);
  if (trimmed.length > max) return fail(`${field} excede ${max} caracteres`);
  return ok(trimmed);
}

function oneOf<Value extends string>(
  value: unknown,
  allowed: readonly Value[],
  field: string,
): ParseResult<Value> {
  if (typeof value !== "string" || !allowed.includes(value as Value)) {
    return fail(`${field} inválido`);
  }
  return ok(value as Value);
}

function boundedInteger(
  value: unknown,
  field: string,
  max: number,
): ParseResult<number> {
  if (typeof value !== "number" || !Number.isSafeInteger(value)) {
    return fail(`${field} debe ser un entero`);
  }
  if (value < 0 || value > max) return fail(`${field} fuera de rango`);
  return ok(value);
}

function isoTimestamp(value: unknown, field: string): ParseResult<string> {
  if (typeof value !== "string") return fail(`${field} debe ser string`);
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return fail(`${field} no es una fecha ISO válida`);
  return ok(new Date(parsed).toISOString());
}

/** Acepta sólo emails simples. No pretende cubrir el RFC completo. */
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;

export function parseEmail(value: unknown): ParseResult<string> {
  const parsed = boundedString(value, "email");
  if (!parsed.ok) return parsed;
  const normalized = parsed.value.toLowerCase();
  if (!emailPattern.test(normalized)) return fail("email inválido");
  return ok(normalized);
}

export function parseEnrollRequest(value: unknown): ParseResult<EnrollRequest> {
  if (!isRecord(value)) return fail("cuerpo inválido");

  const code = boundedString(value.code, "code", 64);
  if (!code.ok) return code;

  const email = parseEmail(value.email);
  if (!email.ok) return email;

  const extensionVersion = boundedString(
    value.extensionVersion,
    "extensionVersion",
    32,
  );
  if (!extensionVersion.ok) return extensionVersion;

  return ok({
    code: code.value.toUpperCase(),
    email: email.value,
    extensionVersion: extensionVersion.value,
  });
}

function parseRule(value: unknown): ParseResult<TelemetryRule> {
  if (!isRecord(value)) return fail("regla inválida");

  const ruleId = boundedString(value.ruleId, "ruleId", 64);
  if (!ruleId.ok) return ruleId;

  const ruleSource = oneOf<RuleSource>(
    value.ruleSource,
    ruleSources,
    "ruleSource",
  );
  if (!ruleSource.ok) return ruleSource;

  const category = boundedString(value.category, "category", 64);
  if (!category.ok) return category;

  const severity = oneOf<RuleSeverity>(
    value.severity,
    ruleSeverities,
    "severity",
  );
  if (!severity.ok) return severity;

  return ok({
    ruleId: ruleId.value,
    ruleSource: ruleSource.value,
    category: category.value,
    severity: severity.value,
  });
}

export function parseTelemetryEvent(
  value: unknown,
): ParseResult<TelemetryEvent> {
  if (!isRecord(value)) return fail("evento inválido");

  const id = boundedString(value.id, "id", 64);
  if (!id.ok) return id;

  const occurredAt = isoTimestamp(value.occurredAt, "occurredAt");
  if (!occurredAt.ok) return occurredAt;

  const provider = boundedString(value.provider, "provider", 32);
  if (!provider.ok) return provider;

  const decision = oneOf<PolicyDecision>(
    value.decision,
    policyDecisions,
    "decision",
  );
  if (!decision.ok) return decision;

  const resolution = oneOf<EventResolution>(
    value.resolution,
    eventResolutions,
    "resolution",
  );
  if (!resolution.ok) return resolution;

  const topSeverity = oneOf<RuleSeverity>(
    value.topSeverity,
    ruleSeverities,
    "topSeverity",
  );
  if (!topSeverity.ok) return topSeverity;

  const score = boundedInteger(value.score, "score", 100);
  if (!score.ok) return score;

  const durationMs = boundedInteger(
    value.durationMs,
    "durationMs",
    10 * 60 * 1000,
  );
  if (!durationMs.ok) return durationMs;

  if (!Array.isArray(value.rules)) return fail("rules debe ser un array");
  if (value.rules.length === 0) return fail("rules no puede estar vacío");
  if (value.rules.length > limits.maxRulesPerEvent) {
    return fail("rules excede el máximo permitido");
  }

  const rules: TelemetryRule[] = [];
  for (const entry of value.rules) {
    const rule = parseRule(entry);
    if (!rule.ok) return fail(rule.error);
    rules.push(rule.value);
  }

  return ok({
    id: id.value,
    occurredAt: occurredAt.value,
    provider: provider.value,
    decision: decision.value,
    resolution: resolution.value,
    topSeverity: topSeverity.value,
    score: score.value,
    durationMs: durationMs.value,
    rules,
  });
}

export function parseEventBatch(
  value: unknown,
): ParseResult<EventBatchRequest> {
  if (!isRecord(value)) return fail("cuerpo inválido");
  if (!Array.isArray(value.events)) return fail("events debe ser un array");
  if (value.events.length === 0) return fail("events no puede estar vacío");
  if (value.events.length > limits.maxBatchSize) {
    return fail(`events excede ${limits.maxBatchSize}`);
  }
  return ok({ events: value.events as readonly TelemetryEvent[] });
}

function parseCounters(value: unknown): ParseResult<TelemetryCounters> {
  if (!isRecord(value)) return fail("counters inválido");
  const max = Number.MAX_SAFE_INTEGER;
  const keys = [
    "analyzedCount",
    "allowedCount",
    "warnedCount",
    "blockedCount",
    "redactedCount",
    "droppedCount",
  ] as const;

  const result: Record<string, number> = {};
  for (const key of keys) {
    const parsed = boundedInteger(value[key], key, max);
    if (!parsed.ok) return fail(parsed.error);
    result[key] = parsed.value;
  }

  return ok(result as unknown as TelemetryCounters);
}

export function parseHeartbeat(value: unknown): ParseResult<HeartbeatRequest> {
  if (!isRecord(value)) return fail("cuerpo inválido");

  const counters = parseCounters(value.counters);
  if (!counters.ok) return counters;

  const extensionVersion = boundedString(
    value.extensionVersion,
    "extensionVersion",
    32,
  );
  if (!extensionVersion.ok) return extensionVersion;

  return ok({
    counters: counters.value,
    extensionVersion: extensionVersion.value,
  });
}

/**
 * Valida el config.json inyectado en el paquete. Devuelve `null` en vez de
 * error porque la ausencia de configuración es un estado válido: la extensión
 * funciona en modo local sin telemetría.
 */
export function parseRuntimeConfig(value: unknown): RuntimeConfig | null {
  if (!isRecord(value)) return null;

  const apiBaseUrl = boundedString(value.apiBaseUrl, "apiBaseUrl", 300);
  if (!apiBaseUrl.ok) return null;
  if (!/^https?:\/\//u.test(apiBaseUrl.value)) return null;

  const companyId = boundedString(value.companyId, "companyId", 64);
  const companyName = boundedString(value.companyName, "companyName", 120);
  const enrollmentCode = boundedString(
    value.enrollmentCode,
    "enrollmentCode",
    64,
  );

  const config: {
    apiBaseUrl: string;
    companyId?: string;
    companyName?: string;
    enrollmentCode?: string;
  } = { apiBaseUrl: apiBaseUrl.value.replace(/\/+$/u, "") };

  if (companyId.ok) config.companyId = companyId.value;
  if (companyName.ok) config.companyName = companyName.value;
  if (enrollmentCode.ok) {
    config.enrollmentCode = enrollmentCode.value.toUpperCase();
  }

  return config;
}
