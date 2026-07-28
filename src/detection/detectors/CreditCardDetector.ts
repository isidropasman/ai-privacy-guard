import type {
  DetectionFinding,
  DetectionInput,
  SensitiveDataDetector,
} from "../types";
import { createFinding } from "../finding";

const cardCandidatePattern = /(?<!\d)(?:\d[ -]?){12,18}\d(?!\d)/g;

export class CreditCardDetector implements SensitiveDataDetector {
  readonly id = "credit-card";
  readonly label = "Tarjeta";
  detect(input: DetectionInput): DetectionFinding[] {
    return [...input.text.matchAll(cardCandidatePattern)].flatMap(
      (match, index) => {
        if (match.index === undefined) {
          return [];
        }
        const digits = match[0].replace(/\D/g, "");
        if (digits.length < 13 || digits.length > 19 || !passesLuhn(digits)) {
          return [];
        }

        return [
          createFinding({
            detectorId: this.id,
            index,
            category: "payment-card",
            severity: "critical",
            confidence: 0.99,
            start: match.index,
            end: match.index + match[0].length,
            safePreview: `•••• ${digits.slice(-4)}`,
            explanation:
              "El número tiene longitud y checksum válidos para una tarjeta.",
            suggestedReplacement: "[PAYMENT_CARD_REMOVED]",
          }),
        ];
      },
    );
  }
}

function passesLuhn(digits: string): boolean {
  let sum = 0;
  let doubleDigit = false;

  for (let index = digits.length - 1; index >= 0; index -= 1) {
    let digit = Number(digits[index]);
    if (doubleDigit) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    doubleDigit = !doubleDigit;
  }

  return sum % 10 === 0;
}
