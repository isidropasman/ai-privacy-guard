import type {
  DetectionFinding,
  DetectionInput,
  SensitiveDataDetector,
} from "../types";
import { createFinding } from "../finding";

const emailPattern = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;

export class EmailDetector implements SensitiveDataDetector {
  readonly id = "email";
  readonly label = "Email";
  detect(input: DetectionInput): DetectionFinding[] {
    return [...input.text.matchAll(emailPattern)].flatMap((match, index) => {
      if (match.index === undefined) return [];
      const [local = "", domain = ""] = match[0].split("@");
      return [
        createFinding({
          detectorId: this.id,
          index,
          category: "email",
          severity: "medium",
          confidence: 0.98,
          start: match.index,
          end: match.index + match[0].length,
          safePreview: `${local.slice(0, 1)}•••@${domain}`,
          explanation: "El texto incluye un email de contacto.",
          suggestedReplacement: "[EMAIL_CONTACT]",
        }),
      ];
    });
  }
}
