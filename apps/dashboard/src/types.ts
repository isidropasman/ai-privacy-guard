export type RuleSeverity = "low" | "medium" | "high" | "critical";
export type RuleAction = "allow" | "warn" | "replace" | "block";

export interface CustomRule {
  readonly id: string;
  readonly name: string;
  readonly keywords: readonly string[];
  readonly severity: RuleSeverity;
  readonly action: RuleAction;
  readonly enabled: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface InterceptionEvent {
  readonly id: string;
  readonly occurredAt: string;
  readonly user: string;
  readonly provider: string;
  readonly dataType: string;
  readonly ruleName: string;
  readonly severity: RuleSeverity;
  readonly action: RuleAction;
}
