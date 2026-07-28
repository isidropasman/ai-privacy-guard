import { describe, expect, test } from "vitest";
import { createDetectorEngine } from "../../../src/detection/createDetectorEngine";
import { defaultSettings } from "../../../src/storage/SettingsRepository";

describe("createDetectorEngine", () => {
  test("always detects critical credentials", () => {
    const findings = createDetectorEngine(defaultSettings).detect({
      text: "OPENAI_API_KEY=sk-proj-example-for-testing",
      configuredTerms: [],
    });

    expect(findings.some((finding) => finding.category === "credential")).toBe(
      true,
    );
  });

  test("respects PII and financial warning toggles", () => {
    const disabled = {
      ...defaultSettings,
      warningsEnabled: false,
      financialDetectionEnabled: false,
    };
    const findings = createDetectorEngine(disabled).detect({
      text: "juan@example.com. Margen interno 47% no fue comunicado.",
      configuredTerms: [],
    });

    expect(findings).toEqual([]);
  });
});
