import type {
  DetectionFinding,
  DetectionInput,
  SensitiveDataDetector,
} from "../types";
import { createFinding } from "../finding";

const phonePattern =
  /(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)\d{3,4}[\s.-]\d{4}\b/g;

export class PhoneDetector implements SensitiveDataDetector {
  readonly id = "phone";
  readonly label = "Teléfono";
  detect(input: DetectionInput): DetectionFinding[] {
    return [...input.text.matchAll(phonePattern)].flatMap((match, index) => {
      if (match.index === undefined) return [];
      const context = input.text.slice(
        Math.max(0, match.index - 24),
        match.index,
      );
      if (
        !/\b(?:tel[eé]fono|celular|phone|whatsapp|contacto)\b/i.test(context)
      ) {
        return [];
      }
      const digits = match[0].replace(/\D/g, "");
      return [
        createFinding({
          detectorId: this.id,
          index,
          category: "phone",
          severity: "medium",
          confidence: 0.9,
          start: match.index,
          end: match.index + match[0].length,
          safePreview: `•••• ${digits.slice(-4)}`,
          explanation: "El texto incluye un teléfono de contacto.",
          suggestedReplacement: "[PHONE_NUMBER]",
        }),
      ];
    });
  }
}
