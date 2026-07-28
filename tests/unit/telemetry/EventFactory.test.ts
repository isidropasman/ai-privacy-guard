import { describe, expect, test } from "vitest";
import type { DetectionFinding } from "../../../src/detection/types";
import {
  createTelemetryEvent,
  type SubmissionOutcome,
} from "../../../src/telemetry/EventFactory";

const secret = "sk-proj-SUPERSECRETVALUE123456";

function finding(overrides: Partial<DetectionFinding> = {}): DetectionFinding {
  return {
    id: "api-key:0:24:0",
    detectorId: "api-key",
    category: "credential",
    severity: "critical",
    confidence: 0.95,
    start: 12,
    end: 36,
    matchedText: secret,
    safePreview: "sk-proj-SUPE…3456",
    explanation: `Se encontró la credencial ${secret} en el prompt`,
    suggestedReplacement: "[API_KEY_REDACTADA]",
    ...overrides,
  };
}

function outcome(
  overrides: Partial<SubmissionOutcome> = {},
): SubmissionOutcome {
  return {
    provider: "ChatGPT",
    decision: "BLOCK",
    resolution: "redacted",
    score: 100,
    durationMs: 42,
    findings: [finding()],
    ...overrides,
  };
}

const dependencies = {
  now: () => new Date("2026-07-28T18:00:00.000Z"),
  randomId: () => "evt-fixed-id",
};

describe("createTelemetryEvent", () => {
  test("no propaga ningún campo con texto del prompt", () => {
    const event = createTelemetryEvent(outcome(), dependencies);
    const serialized = JSON.stringify(event);

    for (const forbidden of [
      "matchedText",
      "safePreview",
      "explanation",
      "suggestedReplacement",
      "start",
      "end",
      "confidence",
    ]) {
      expect(serialized).not.toContain(forbidden);
    }
  });

  test("no filtra el valor detectado ni fragmentos del mismo", () => {
    const event = createTelemetryEvent(outcome(), dependencies);
    const serialized = JSON.stringify(event);

    expect(serialized).not.toContain(secret);
    expect(serialized).not.toContain("SUPERSECRET");
    expect(serialized).not.toContain("sk-proj");
    expect(serialized).not.toContain("SUPE…3456");
  });

  test("conserva sólo identificador, categoría y severidad de cada regla", () => {
    const event = createTelemetryEvent(outcome(), dependencies);

    expect(event?.rules).toEqual([
      {
        ruleId: "api-key",
        ruleSource: "base",
        category: "credential",
        severity: "critical",
      },
    ]);
  });

  test("agrupa varios findings del mismo detector en una sola regla", () => {
    const event = createTelemetryEvent(
      outcome({
        findings: [
          finding({ id: "api-key:0", severity: "high" }),
          finding({ id: "api-key:1", severity: "critical" }),
          finding({ id: "api-key:2", severity: "low" }),
        ],
      }),
      dependencies,
    );

    expect(event?.rules).toHaveLength(1);
    expect(event?.rules[0]?.severity).toBe("critical");
  });

  test("la severidad del evento es la más alta entre sus reglas", () => {
    const event = createTelemetryEvent(
      outcome({
        findings: [
          finding({
            detectorId: "email",
            category: "email",
            severity: "medium",
          }),
          finding({ detectorId: "jwt", category: "jwt", severity: "critical" }),
          finding({ detectorId: "phone", category: "phone", severity: "low" }),
        ],
      }),
      dependencies,
    );

    expect(event?.topSeverity).toBe("critical");
    expect(event?.rules).toHaveLength(3);
  });

  test("sin findings no se emite evento", () => {
    expect(createTelemetryEvent(outcome({ findings: [] }), dependencies)).toBe(
      null,
    );
  });

  test("acota el score al rango válido", () => {
    expect(
      createTelemetryEvent(outcome({ score: 999 }), dependencies)?.score,
    ).toBe(100);
    expect(
      createTelemetryEvent(outcome({ score: -5 }), dependencies)?.score,
    ).toBe(0);
    expect(
      createTelemetryEvent(outcome({ score: Number.NaN }), dependencies)?.score,
    ).toBe(0);
  });

  test("conserva decisión, resolución y proveedor", () => {
    const event = createTelemetryEvent(
      outcome({ decision: "WARN", resolution: "sent_original" }),
      dependencies,
    );

    expect(event).toMatchObject({
      id: "evt-fixed-id",
      occurredAt: "2026-07-28T18:00:00.000Z",
      provider: "ChatGPT",
      decision: "WARN",
      resolution: "sent_original",
      durationMs: 42,
    });
  });
});
