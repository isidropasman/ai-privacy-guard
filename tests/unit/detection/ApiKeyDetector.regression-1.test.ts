import { describe, expect, test } from "vitest";
import { ApiKeyDetector } from "../../../src/detection/detectors/ApiKeyDetector";

describe("ApiKeyDetector JSON regression", () => {
  // Regression: ISSUE-001 — quoted JSON property names bypassed credential detection.
  // Found by /qa on 2026-07-28.
  test("blocks a secret assigned to a quoted JSON property", () => {
    const findings = new ApiKeyDetector().detect({
      text: '"OPENAI_API_KEY": "sk_fixture_1234567890"',
      configuredTerms: [],
    });

    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({
      category: "credential",
      severity: "critical",
      suggestedReplacement: "[API_KEY_REMOVED]",
    });
  });
});
