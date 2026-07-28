import { describe, expect, it } from "vitest";
import { incidentDocument } from "../../data/incidentDemo";
import {
  transitionIncident,
  type IncidentDemoState,
} from "./incidentDemoMachine";

describe("transitionIncident", () => {
  it("recorre el flujo de análisis y envío protegido", () => {
    const events = [
      { type: "START" },
      { type: "FILE_LOADED" },
      { type: "SCAN_COMPLETED" },
      { type: "REDACT" },
      { type: "REDACTION_COMPLETED" },
      { type: "APPROVE" },
      { type: "SEND" },
    ] as const;

    const finalState = events.reduce<IncidentDemoState>(
      (state, event) => transitionIncident(state, event),
      "ready",
    );

    expect(finalState).toBe("sent");
  });

  it.each([
    ["ready", { type: "SEND" }],
    ["loading-file", { type: "REDACT" }],
    ["scanning", { type: "APPROVE" }],
    ["findings", { type: "FILE_LOADED" }],
    ["redacting", { type: "START" }],
    ["review", { type: "SCAN_COMPLETED" }],
    ["safe-to-send", { type: "REDACT" }],
    ["sent", { type: "APPROVE" }],
  ] as const)("mantiene %s ante %o", (state, event) => {
    expect(transitionIncident(state, event)).toBe(state);
  });

  it("vuelve al estado inicial desde cualquier punto", () => {
    const states: readonly IncidentDemoState[] = [
      "ready",
      "loading-file",
      "scanning",
      "findings",
      "redacting",
      "review",
      "safe-to-send",
      "sent",
    ];

    for (const state of states) {
      expect(transitionIncident(state, { type: "RESET" })).toBe("ready");
    }
  });

  it("define el documento ficticio con las métricas del incidente", () => {
    expect(incidentDocument).toMatchObject({
      name: "Propuesta_ACME_Q4.pdf",
      pageCount: 38,
      criticalFindings: 7,
      confidentialPercentage: 42,
      protectedCharacters: 14_820,
    });
    expect(incidentDocument.findings).toHaveLength(18);
    expect(
      incidentDocument.findings.filter(
        (finding) => finding.severity === "critical",
      ),
    ).toHaveLength(7);
  });
});
