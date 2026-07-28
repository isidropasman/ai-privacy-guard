/**
 * Contratos compartidos entre la extensión, el API y el dashboard.
 *
 * Este paquete no tiene dependencias: se importa por ruta relativa desde los
 * tres consumidores para que ninguno pueda desincronizarse del otro.
 */

export type RuleSeverity = "low" | "medium" | "high" | "critical";
export type PolicyDecision = "ALLOW" | "WARN" | "BLOCK";
export type RuleSource = "base" | "custom";

export type EventResolution =
  "blocked" | "redacted" | "sent_original" | "cancelled";

export const ruleSeverities: readonly RuleSeverity[] = [
  "low",
  "medium",
  "high",
  "critical",
];

export const policyDecisions: readonly PolicyDecision[] = [
  "ALLOW",
  "WARN",
  "BLOCK",
];

export const ruleSources: readonly RuleSource[] = ["base", "custom"];

export const eventResolutions: readonly EventResolution[] = [
  "blocked",
  "redacted",
  "sent_original",
  "cancelled",
];

/** Orden de severidad, de menor a mayor. Define cuál es la severidad máxima. */
export const severityRank: Record<RuleSeverity, number> = {
  low: 0,
  medium: 1,
  high: 2,
  critical: 3,
};

/** Regla que se activó durante un envío. Nunca lleva texto detectado. */
export interface TelemetryRule {
  readonly ruleId: string;
  readonly ruleSource: RuleSource;
  readonly category: string;
  readonly severity: RuleSeverity;
}

/**
 * Un evento representa un envío del usuario, no una regla.
 *
 * Campos prohibidos por diseño: prompt, texto detectado, safePreview, offsets,
 * texto redactado y URL de conversación. `EventFactory` es la única función
 * autorizada a construir este objeto.
 */
export interface TelemetryEvent {
  readonly id: string;
  readonly occurredAt: string;
  readonly provider: string;
  readonly decision: PolicyDecision;
  readonly resolution: EventResolution;
  readonly topSeverity: RuleSeverity;
  readonly score: number;
  readonly durationMs: number;
  readonly rules: readonly TelemetryRule[];
}

export interface TelemetryCounters {
  readonly analyzedCount: number;
  readonly allowedCount: number;
  readonly warnedCount: number;
  readonly blockedCount: number;
  readonly redactedCount: number;
  readonly droppedCount: number;
}

export interface EnrollRequest {
  readonly code: string;
  readonly email: string;
  readonly extensionVersion: string;
}

export interface EnrollResponse {
  readonly installationId: string;
  readonly token: string;
  readonly company: { readonly id: string; readonly name: string };
  readonly userEmail: string;
}

export interface EventBatchRequest {
  readonly events: readonly TelemetryEvent[];
}

export interface EventBatchResponse {
  readonly accepted: number;
  readonly rejected: readonly {
    readonly id: string;
    readonly reason: string;
  }[];
}

export interface HeartbeatRequest {
  readonly counters: TelemetryCounters;
  readonly extensionVersion: string;
}

/**
 * Configuración inyectada en el paquete de cada empresa al descargarlo.
 * Se lee en runtime desde config.json, no en tiempo de compilación.
 *
 * Sólo `apiBaseUrl` es obligatorio. Un build de desarrollo trae únicamente esa
 * URL y el usuario tipea el código a mano; el paquete de una empresa trae
 * además su identidad y su código, y entonces sólo se pide el email.
 */
export interface RuntimeConfig {
  readonly apiBaseUrl: string;
  readonly companyId?: string;
  readonly companyName?: string;
  readonly enrollmentCode?: string;
}

export const limits = {
  maxBatchSize: 50,
  maxRulesPerEvent: 20,
  maxStringLength: 200,
  maxQueueSize: 200,
  maxBodyBytes: 64 * 1024,
} as const;
