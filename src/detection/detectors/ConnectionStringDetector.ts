import type {
  DetectionFinding,
  DetectionInput,
  SensitiveDataDetector,
} from "../types";
import { createFinding } from "../finding";

const connectionStringPattern =
  /\b(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?|redis|rediss|mssql):\/\/[^\s/:@]+:[^\s@/]+@[^\s"'`]+/gi;

export class ConnectionStringDetector implements SensitiveDataDetector {
  readonly id = "connection-string";
  readonly label = "Conexión con credenciales";
  detect(input: DetectionInput): DetectionFinding[] {
    return [...input.text.matchAll(connectionStringPattern)].flatMap(
      (match, index) =>
        match.index === undefined
          ? []
          : [
              createFinding({
                detectorId: this.id,
                index,
                category: "connection-string",
                severity: "critical",
                confidence: 0.99,
                start: match.index,
                end: match.index + match[0].length,
                safePreview: "Conexión con credenciales oculta",
                explanation:
                  "La cadena incluye usuario y contraseña de una base de datos.",
                suggestedReplacement: "[CONNECTION_STRING_REMOVED]",
              }),
            ],
    );
  }
}
