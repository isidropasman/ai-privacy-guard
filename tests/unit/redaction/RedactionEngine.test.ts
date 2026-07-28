import { describe, expect, test } from "vitest";
import { RedactionEngine } from "../../../src/redaction/RedactionEngine";
import type { DetectionFinding } from "../../../src/detection/types";

function finding(
  start: number,
  end: number,
  replacement: string,
  overrides: Partial<DetectionFinding> = {},
): DetectionFinding {
  return {
    id: `${start}-${end}`,
    detectorId: "fixture",
    category: "email",
    severity: "medium",
    confidence: 1,
    start,
    end,
    safePreview: "hidden",
    explanation: "Fixture",
    suggestedReplacement: replacement,
    ...overrides,
  };
}

describe("RedactionEngine", () => {
  test("replaces multiple findings without shifting later offsets", () => {
    const text = "Email juan@example.com y monto USD 120.000.";
    const emailStart = text.indexOf("juan@example.com");
    const amountStart = text.indexOf("USD 120.000");

    const result = new RedactionEngine().redact(text, [
      finding(
        emailStart,
        emailStart + "juan@example.com".length,
        "[EMAIL_CONTACT]",
      ),
      finding(
        amountStart,
        amountStart + "USD 120.000".length,
        "[CONFIDENTIAL_AMOUNT]",
        { category: "financial", severity: "high" },
      ),
    ]);

    expect(result.text).toBe(
      "Email [EMAIL_CONTACT] y monto [CONFIDENTIAL_AMOUNT].",
    );
    expect(result.replacements).toHaveLength(2);
  });

  test("keeps the highest-severity overlapping finding", () => {
    const text = "token=sk-proj-example-for-testing";

    const result = new RedactionEngine().redact(text, [
      finding(0, text.length, "[GENERIC]", {
        category: "confidential-term",
      }),
      finding(6, text.length, "[API_KEY_REMOVED]", {
        category: "credential",
        severity: "critical",
      }),
    ]);

    expect(result.text).toBe("token=[API_KEY_REMOVED]");
    expect(result.replacements).toHaveLength(1);
  });

  test("uses the same category-specific replacement for repeated terms", () => {
    const text = "ACME y ACME";

    const result = new RedactionEngine().redact(text, [
      finding(0, 4, "[CLIENT_NAME]", { category: "confidential-term" }),
      finding(7, 11, "[CLIENT_NAME]", { category: "confidential-term" }),
    ]);

    expect(result.text).toBe("[CLIENT_NAME] y [CLIENT_NAME]");
  });

  test("ignores invalid offsets instead of losing content", () => {
    const result = new RedactionEngine().redact("safe", [
      finding(-1, 30, "[BROKEN]"),
    ]);

    expect(result).toEqual({ text: "safe", replacements: [] });
  });
});
