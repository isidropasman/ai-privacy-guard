import { describe, expect, test } from "vitest";
import { describeBaseRules } from "../../../src/detection/createDetectorEngine";

describe("describeBaseRules", () => {
  test("lists all 11 base detectors exactly once", () => {
    const ids = describeBaseRules().map((rule) => rule.id);

    expect(ids).toHaveLength(11);
    expect(new Set(ids).size).toBe(11);
  });

  test("marks critical detectors and the confidential keyword detector as always active", () => {
    const alwaysActiveIds = describeBaseRules()
      .filter((rule) => rule.alwaysActive)
      .map((rule) => rule.id)
      .sort();

    expect(alwaysActiveIds).toEqual(
      [
        "api-key",
        "confidential-keyword",
        "connection-string",
        "credit-card",
        "jwt",
        "private-key",
      ].sort(),
    );
  });

  test("marks PII detectors as conditioned by warningsEnabled", () => {
    const warningsIds = describeBaseRules()
      .filter((rule) => rule.requiresSetting === "warningsEnabled")
      .map((rule) => rule.id)
      .sort();

    expect(warningsIds).toEqual(
      ["argentine-identity", "email", "person-name", "phone"].sort(),
    );
  });

  test("marks the financial detector as conditioned by financialDetectionEnabled", () => {
    const financialIds = describeBaseRules()
      .filter((rule) => rule.requiresSetting === "financialDetectionEnabled")
      .map((rule) => rule.id);

    expect(financialIds).toEqual(["financial-information"]);
  });

  test("carries a non-empty label and description for every rule", () => {
    for (const rule of describeBaseRules()) {
      expect(rule.label.length).toBeGreaterThan(0);
      expect(rule.description.length).toBeGreaterThan(0);
    }
  });
});
