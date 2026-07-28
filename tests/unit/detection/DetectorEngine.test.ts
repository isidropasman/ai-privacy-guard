import { describe, expect, test, vi } from "vitest";
import { DetectorEngine } from "../../../src/detection/DetectorEngine";
import type {
  DetectionFinding,
  DetectionInput,
  SensitiveDataDetector,
} from "../../../src/detection/types";

describe("DetectorEngine", () => {
  test("runs every detector and sorts findings by offset", () => {
    const laterFinding: DetectionFinding = {
      id: "later-5",
      detectorId: "later",
      category: "email",
      severity: "medium",
      confidence: 1,
      start: 5,
      end: 8,
      safePreview: "•••",
      explanation: "later",
      suggestedReplacement: "[EMAIL_CONTACT]",
    };
    const later: SensitiveDataDetector = {
      id: "later",
      label: "Later",
      detect: () => [laterFinding],
    };
    const earlier: SensitiveDataDetector = {
      ...later,
      id: "earlier",
      label: "Earlier",
      detect: () => [
        {
          ...laterFinding,
          id: "earlier-1",
          detectorId: "earlier",
          start: 1,
          end: 3,
        },
      ],
    };

    const findings = new DetectorEngine([later, earlier]).detect({
      text: "abcdefgh",
      configuredTerms: [],
    });

    expect(findings.map((finding) => finding.id)).toEqual([
      "earlier-1",
      "later-5",
    ]);
  });

  test("reuses only the current in-memory input result", () => {
    const detect = vi.fn((_input: DetectionInput) => []);
    const detector: SensitiveDataDetector = {
      id: "fixture",
      label: "Fixture",
      detect,
    };
    const engine = new DetectorEngine([detector]);
    const input = { text: "same", configuredTerms: ["ACME"] };

    engine.detect(input);
    engine.detect(input);
    engine.detect({ text: "changed", configuredTerms: ["ACME"] });

    expect(detect).toHaveBeenCalledTimes(2);
  });

  test("exposes the registered detectors through a public getter", () => {
    const fixture: SensitiveDataDetector = {
      id: "fixture",
      label: "Fixture",
      detect: () => [],
    };

    const engine = new DetectorEngine([fixture]);

    expect(engine.detectors).toEqual([fixture]);
  });
});
