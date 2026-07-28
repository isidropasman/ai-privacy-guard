import type {
  DetectionFinding,
  DetectionInput,
  SensitiveDataDetector,
} from "../types";
import { createFinding } from "../finding";

const personNamePattern =
  /\b(?:escribirle|contactar|contact[áa]|enviarle un mensaje)\s+a\s+([A-ZÁÉÍÓÚÑ][\p{L}'’-]+(?:\s+[A-ZÁÉÍÓÚÑ][\p{L}'’-]+){1,2})\b/giu;

export class PersonNameDetector implements SensitiveDataDetector {
  readonly id = "person-name";
  readonly label = "Nombre de persona";
  detect(input: DetectionInput): DetectionFinding[] {
    return [...input.text.matchAll(personNamePattern)].flatMap(
      (match, index) => {
        const name = match[1];
        if (name === undefined || match.index === undefined) return [];
        const start = match.index + match[0].lastIndexOf(name);
        return [
          createFinding({
            detectorId: this.id,
            index,
            category: "person-name",
            severity: "medium",
            confidence: 0.85,
            start,
            end: start + name.length,
            safePreview: "Nombre de persona oculto",
            explanation: "El texto incluye un nombre personal en contexto.",
            suggestedReplacement: "[PERSON_NAME]",
          }),
        ];
      },
    );
  }
}
