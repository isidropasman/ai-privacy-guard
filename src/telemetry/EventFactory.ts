import {
  severityRank,
  type PolicyDecision,
  type RuleSeverity,
  type TelemetryEvent,
  type TelemetryRule,
} from "../../packages/contracts/src/index";
import type { DetectionFinding } from "../detection/types";
import type { EventResolution } from "../../packages/contracts/src/index";

/**
 * Resultado de un envío revisado. Es lo único que el content script emite.
 */
export interface SubmissionOutcome {
  readonly provider: string;
  readonly decision: PolicyDecision;
  readonly resolution: EventResolution;
  readonly score: number;
  readonly durationMs: number;
  readonly findings: readonly DetectionFinding[];
}

export interface EventFactoryDependencies {
  readonly now: () => Date;
  readonly randomId: () => string;
}

const defaultDependencies: EventFactoryDependencies = {
  now: () => new Date(),
  randomId: () => crypto.randomUUID(),
};

/**
 * Única función autorizada a construir el payload de telemetría.
 *
 * Deriva de cada finding sólo el identificador del detector, su categoría y su
 * severidad. Nunca copia `matchedText`, `safePreview`, `explanation`,
 * `suggestedReplacement` ni los offsets, porque cualquiera de esos campos
 * reconstruiría parte del prompt del usuario del otro lado.
 */
export function createTelemetryEvent(
  outcome: SubmissionOutcome,
  dependencies: EventFactoryDependencies = defaultDependencies,
): TelemetryEvent | null {
  const rules = toRules(outcome.findings);
  if (rules.length === 0) return null;

  return {
    id: dependencies.randomId(),
    occurredAt: dependencies.now().toISOString(),
    provider: outcome.provider,
    decision: outcome.decision,
    resolution: outcome.resolution,
    topSeverity: highestSeverity(rules),
    score: clampScore(outcome.score),
    durationMs: Math.max(0, Math.round(outcome.durationMs)),
    rules,
  };
}

function toRules(
  findings: readonly DetectionFinding[],
): readonly TelemetryRule[] {
  const byRule = new Map<string, TelemetryRule>();

  for (const finding of findings) {
    const existing = byRule.get(finding.detectorId);
    if (
      existing !== undefined &&
      severityRank[existing.severity] >= severityRank[finding.severity]
    ) {
      continue;
    }

    byRule.set(finding.detectorId, {
      ruleId: finding.detectorId,
      ruleSource: "base",
      category: finding.category,
      severity: finding.severity,
    });
  }

  return [...byRule.values()];
}

function highestSeverity(rules: readonly TelemetryRule[]): RuleSeverity {
  let highest: RuleSeverity = "low";
  for (const rule of rules) {
    if (severityRank[rule.severity] > severityRank[highest]) {
      highest = rule.severity;
    }
  }
  return highest;
}

function clampScore(score: number): number {
  if (!Number.isFinite(score)) return 0;
  return Math.min(100, Math.max(0, Math.round(score)));
}
