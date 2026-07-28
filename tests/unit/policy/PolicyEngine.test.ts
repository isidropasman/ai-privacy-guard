import { describe, expect, test } from "vitest";
import { PolicyEngine } from "../../../src/policy/PolicyEngine";
import type { DetectionFinding } from "../../../src/detection/types";

function finding(overrides: Partial<DetectionFinding> = {}): DetectionFinding {
  return {
    id: "fixture",
    detectorId: "fixture",
    category: "email",
    severity: "medium",
    confidence: 0.95,
    start: 0,
    end: 4,
    safePreview: "••••",
    explanation: "Fixture",
    suggestedReplacement: "[SAFE]",
    ...overrides,
  };
}

describe("PolicyEngine", () => {
  test("allows content without relevant findings", () => {
    expect(new PolicyEngine().evaluate([], "safe prompt")).toEqual({
      decision: "ALLOW",
      score: 0,
    });
  });

  test("warns for PII and contextual financial data", () => {
    const result = new PolicyEngine().evaluate(
      [
        finding({ category: "email" }),
        finding({ id: "financial", category: "financial", severity: "high" }),
      ],
      "interno",
    );

    expect(result.decision).toBe("WARN");
    expect(result.score).toBeGreaterThanOrEqual(40);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  test("blocks a high-confidence critical credential", () => {
    const result = new PolicyEngine().evaluate(
      [
        finding({
          category: "credential",
          severity: "critical",
          confidence: 0.99,
        }),
      ],
      "API_KEY=fixture",
    );

    expect(result).toEqual({ decision: "BLOCK", score: 100 });
  });

  test("boosts risk for multiple categories and confidentiality language", () => {
    const engine = new PolicyEngine();
    const base = engine.evaluate([finding()], "contact");
    const combined = engine.evaluate(
      [
        finding(),
        finding({
          id: "term",
          category: "confidential-term",
          severity: "medium",
        }),
      ],
      "Información confidencial, no compartir",
    );

    expect(combined.score).toBeGreaterThan(base.score);
  });
});
