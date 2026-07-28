import type {
  DetectionFinding,
  DetectionInput,
  SensitiveDataDetector,
} from "../types";
import { createFinding } from "../finding";

// Case-insensitive on purpose: people type names in lowercase. Capitalization
// can't carry the signal, so the noun-phrase guards below carry it instead.
const verb = String.raw`(?:escrib|contact|envi|mand)(?:ir|ar|[áa]|[íi])?(?:le|les|lo|la|los|las)?`;
const object = String.raw`(?:\s+(?:un|una|el|la)\s+\p{L}+)?`;
const notAPerson =
  "la|el|los|las|un|una|unos|unas|mi|tu|su|sus|nuestro|nuestra|este|esta|estos|estas|ese|esa|esos|esas|todos|todas|alguien|nadie|quien|ellos|ellas";
const connector = `${notAPerson}|de|del|con|para|por|que|y|o|en|sobre|desde|hasta`;
const word = String.raw`\p{L}[\p{L}'’-]+`;

const personNamePattern = new RegExp(
  String.raw`\b${verb}${object}\s+a\s+((?!(?:${notAPerson})\b)${word}(?:\s+(?!(?:${connector})\b)${word}){1,2})`,
  "giu",
);

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
