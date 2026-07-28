import { expect, test } from "vitest";
import { createDetectorEngine } from "../../../src/detection/createDetectorEngine";
import { defaultSettings } from "../../../src/storage/SettingsRepository";

test("analyzes a 10,000-character prompt within the MVP budget", () => {
  const engine = createDetectorEngine(defaultSettings);
  const text = `${"Texto seguro sin datos sensibles. ".repeat(330)}fin`.slice(
    0,
    10_000,
  );
  const start = performance.now();

  const findings = engine.detect({ text, configuredTerms: [] });
  const duration = performance.now() - start;

  expect(findings).toEqual([]);
  expect(duration).toBeLessThan(150);
});
