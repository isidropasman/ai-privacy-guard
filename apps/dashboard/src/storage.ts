import { initialRules } from "./mockData";
import type { CustomRule, RuleAction, RuleSeverity } from "./types";

const rulesStorageKey = "ai-privacy-guard-dashboard-rules";

export function loadRules(): CustomRule[] {
  try {
    const stored = localStorage.getItem(rulesStorageKey);
    if (stored === null) return [...initialRules];
    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [...initialRules];
    const rules = parsed.filter(isCustomRule);
    return rules.length === parsed.length ? rules : [...initialRules];
  } catch {
    return [...initialRules];
  }
}

export function saveRules(rules: readonly CustomRule[]): void {
  localStorage.setItem(rulesStorageKey, JSON.stringify(rules));
}

function isCustomRule(value: unknown): value is CustomRule {
  if (typeof value !== "object" || value === null) return false;
  const rule = value as Record<string, unknown>;
  return (
    typeof rule.id === "string" &&
    typeof rule.name === "string" &&
    Array.isArray(rule.keywords) &&
    rule.keywords.every((keyword) => typeof keyword === "string") &&
    isSeverity(rule.severity) &&
    isAction(rule.action) &&
    typeof rule.enabled === "boolean" &&
    typeof rule.createdAt === "string" &&
    typeof rule.updatedAt === "string"
  );
}

function isSeverity(value: unknown): value is RuleSeverity {
  return ["low", "medium", "high", "critical"].includes(String(value));
}

function isAction(value: unknown): value is RuleAction {
  return ["allow", "warn", "replace", "block"].includes(String(value));
}
