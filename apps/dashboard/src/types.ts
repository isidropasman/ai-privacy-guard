export type RuleSeverity = "low" | "medium" | "high" | "critical";
export type RuleAction = "allow" | "warn" | "replace" | "block";
export type PolicyDecision = "ALLOW" | "WARN" | "BLOCK";
export type RuleSource = "base" | "custom";

export type EventResolution =
  "blocked" | "redacted" | "sent_original" | "cancelled";

export type CompanyPlan = "starter" | "business" | "enterprise";
export type CompanyStatus = "active" | "onboarding" | "suspended";

export interface CompanyMetrics {
  readonly users: number;
  readonly installations: number;
  readonly staleInstallations: number;
  readonly coverage: number;
  readonly events: number;
  readonly blocked: number;
  readonly rules: number;
  readonly activeRules: number;
  readonly lastEventAt: string | null;
}

export interface Company {
  readonly id: string;
  readonly name: string;
  readonly domain: string;
  readonly industry: string;
  readonly plan: CompanyPlan;
  readonly status: CompanyStatus;
  readonly seats: number;
  readonly createdAt: string;
  readonly enrollmentCode: string | null;
  readonly metrics: CompanyMetrics;
}

export type UserRole = "admin" | "analyst" | "member";
export type UserStatus = "active" | "invited" | "suspended";

export interface CompanyUser {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly area: string;
  readonly role: UserRole;
  readonly status: UserStatus;
  readonly installations: number;
  readonly events: number;
  readonly lastSeenAt: string | null;
}

export interface Installation {
  readonly id: string;
  readonly userEmail: string;
  readonly extensionVersion: string;
  readonly status: string;
  readonly enrolledAt: string;
  readonly lastSeenAt: string | null;
}

export interface EventRule {
  readonly ruleId: string;
  readonly ruleSource: RuleSource;
  readonly category: string;
  readonly severity: RuleSeverity;
}

export interface InterceptionEvent {
  readonly id: string;
  readonly companyId: string;
  readonly companyName: string;
  readonly occurredAt: string;
  readonly receivedAt: string;
  readonly userId: string;
  readonly userEmail: string;
  readonly provider: string;
  readonly decision: PolicyDecision;
  readonly resolution: EventResolution;
  readonly topSeverity: RuleSeverity;
  readonly score: number;
  readonly durationMs: number;
  readonly rules: readonly EventRule[];
}

export interface CustomRule {
  readonly id: string;
  readonly companyId: string;
  readonly name: string;
  readonly description: string;
  readonly keywords: readonly string[];
  readonly severity: RuleSeverity;
  readonly action: RuleAction;
  readonly enabled: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}
