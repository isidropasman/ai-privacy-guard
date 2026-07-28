import { describe, expect, it } from "vitest";
import { buildUploadedIncident } from "./uploadedIncident";

describe("buildUploadedIncident", () => {
  const text = "Contacto: ana.perez@example.com para el alta.";
  const incident = buildUploadedIncident("notas.txt", text);

  it("detecta datos sensibles en el texto cargado", () => {
    expect(incident.findings).toHaveLength(1);
    expect(incident.findings[0].originalValue).toBe("ana.perez@example.com");
  });

  it("reconstruye el texto original desde los segmentos", () => {
    const joined = incident.states.findings.segments
      .map((segment) => segment.text)
      .join("");

    expect(joined).toBe(text);
  });

  it("sustituye el valor en el estado protegido", () => {
    const joined = incident.states.protected.segments
      .map((segment) => segment.text)
      .join("");

    expect(joined).not.toContain("ana.perez@example.com");
    expect(joined).toContain(incident.findings[0].replacement);
  });
});
