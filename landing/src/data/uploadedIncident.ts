import { createDetectorEngine } from "../../../src/detection/createDetectorEngine";
import type { SensitiveCategory } from "../../../src/detection/types";
import { RedactionEngine } from "../../../src/redaction/RedactionEngine";
import type {
  IncidentFinding,
  IncidentSegment,
  IncidentUseCase,
} from "./useCases";

// ponytail: el archivo se corta para que el <pre> no explote; subir si alguien pide leer documentos largos
const MAX_CHARS = 6000;

const categoryLabels: Readonly<Record<SensitiveCategory, string>> = {
  credential: "Credencial de acceso",
  "private-key": "Clave privada",
  jwt: "Token de sesión",
  "connection-string": "Conexión con credenciales",
  "payment-card": "Tarjeta de pago",
  email: "Email de contacto",
  "person-name": "Nombre de persona",
  phone: "Número de teléfono",
  dni: "Documento de identidad",
  "tax-id": "CUIT o CUIL",
  "bank-account": "Dato bancario",
  financial: "Información financiera interna",
  "confidential-term": "Término confidencial",
};

const detectorEngine = createDetectorEngine({
  warningsEnabled: true,
  financialDetectionEnabled: true,
  strictSecrets: true,
  confidentialTerms: [],
  counters: {
    allowedCount: 0,
    warnedCount: 0,
    blockedCount: 0,
    redactedCount: 0,
  },
});
const redactionEngine = new RedactionEngine();

export function buildUploadedIncident(
  fileName: string,
  rawText: string,
): IncidentUseCase {
  const text = rawText.slice(0, MAX_CHARS);
  const detected = detectorEngine.detect({ text, configuredTerms: [] });
  const { replacements } = redactionEngine.redact(text, detected);

  const findings: IncidentFinding[] = replacements.map(
    (replacement, index) => ({
      id: `uploaded-${index}`,
      label: categoryLabels[replacement.category],
      severity:
        detected.find(
          (finding) =>
            finding.start === replacement.start &&
            finding.end === replacement.end,
        )?.severity === "critical"
          ? "critical"
          : "medium",
      originalValue: text.slice(replacement.start, replacement.end),
      replacement: replacement.replacement,
    }),
  );

  const count = findings.length;
  const plural = count === 1 ? "" : "s";

  return {
    id: "uploaded",
    label: "Tu archivo",
    glyph: "↑",
    fileName,
    context: `${count} dato${plural} sensible${plural} en tu archivo`,
    findings,
    states: {
      original: {
        label: "Archivo original",
        status:
          count === 0
            ? "Sin datos sensibles detectados"
            : `${count} dato${plural} sensible${plural} todavía visible${plural}`,
        segments: buildSegments(text, replacements, findings, "plain"),
      },
      findings: {
        label: "Hallazgos",
        status: `${count} coincidencia${plural} señalada${plural}`,
        segments: buildSegments(text, replacements, findings, "sensitive"),
      },
      protected: {
        label: "Versión protegida",
        status:
          count === 0
            ? "Nada que reemplazar"
            : `${count} valor${count === 1 ? "" : "es"} reemplazado${plural}`,
        segments: buildSegments(text, replacements, findings, "replacement"),
      },
    },
  };
}

function buildSegments(
  text: string,
  replacements: readonly { start: number; end: number }[],
  findings: readonly IncidentFinding[],
  tone: IncidentSegment["tone"],
): IncidentSegment[] {
  const segments: IncidentSegment[] = [];
  let cursor = 0;

  replacements.forEach((replacement, index) => {
    const finding = findings[index];

    if (replacement.start > cursor) {
      segments.push({
        text: text.slice(cursor, replacement.start),
        tone: "plain",
      });
    }

    segments.push({
      text:
        tone === "replacement" ? finding.replacement : finding.originalValue,
      tone,
      findingId: finding.id,
    });
    cursor = replacement.end;
  });

  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), tone: "plain" });
  }

  return segments;
}
