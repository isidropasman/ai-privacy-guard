import type { DetectionFinding } from "../detection/types";

export type PolicyDecision = "ALLOW" | "WARN" | "BLOCK";

export interface PolicyResult {
  readonly decision: PolicyDecision;
  readonly score: number;
}

export class PolicyEngine {
  evaluate(findings: readonly DetectionFinding[], text: string): PolicyResult {
    if (findings.length === 0) {
      return { decision: "ALLOW", score: 0 };
    }

    if (
      findings.some(
        (finding) =>
          finding.severity === "critical" && finding.confidence >= 0.8,
      )
    ) {
      return { decision: "BLOCK", score: 100 };
    }

    const categories = new Set(findings.map((finding) => finding.category));
    const baseScore = findings.reduce(
      (score, finding) =>
        score +
        Math.round(
          (categoryWeights[finding.category] ??
            severityWeights[finding.severity]) * finding.confidence,
        ),
      0,
    );
    const categoryBonus = categories.size > 1 ? (categories.size - 1) * 10 : 0;
    const confidentialityBonus =
      /\b(?:confidencial|intern[oa]|no compartir|nda)\b/i.test(text) ? 15 : 0;
    const score = Math.min(
      100,
      baseScore + categoryBonus + confidentialityBonus,
    );
    const relevantFinding = findings.some(
      (finding) => finding.confidence >= 0.5 && finding.severity !== "low",
    );

    return {
      decision: relevantFinding ? "WARN" : "ALLOW",
      score,
    };
  }
}

const categoryWeights: Partial<Record<DetectionFinding["category"], number>> = {
  email: 10,
  phone: 10,
  dni: 25,
  "tax-id": 25,
  "bank-account": 35,
  "confidential-term": 25,
  financial: 30,
  jwt: 60,
  "connection-string": 90,
  credential: 100,
  "private-key": 100,
  "payment-card": 100,
};

const severityWeights: Record<DetectionFinding["severity"], number> = {
  low: 5,
  medium: 15,
  high: 40,
  critical: 100,
};
