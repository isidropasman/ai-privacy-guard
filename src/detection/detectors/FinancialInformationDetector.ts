import type {
  DetectionFinding,
  DetectionInput,
  SensitiveDataDetector,
} from "../types";
import { createFinding } from "../finding";

const financialContext =
  /\b(?:margen|costo interno|valuaci[oó]n|revenue|facturaci[oó]n|ebitda|precio negociado|forecast)\b/i;
const confidentialContext =
  /\b(?:intern[oa]|confidencial|no (?:fue|ha sido|está) (?:comunicad[oa]|anunciad[oa]|publicad[oa])|no compartir|nda)\b/i;
const amountPattern =
  /(?:\b(?:USD|ARS|US\$)\s?\d(?:[\d.,]*\d)?|\$\s?\d(?:[\d.,]*\d)?|\b\d+(?:[.,]\d+)?%)/gi;

export class FinancialInformationDetector implements SensitiveDataDetector {
  readonly id = "financial-information";
  readonly label = "Información financiera";
  detect(input: DetectionInput): DetectionFinding[] {
    if (
      !financialContext.test(input.text) ||
      !confidentialContext.test(input.text)
    ) {
      return [];
    }

    return [...input.text.matchAll(amountPattern)].flatMap((match, index) =>
      match.index === undefined
        ? []
        : [
            createFinding({
              detectorId: this.id,
              index,
              category: "financial",
              severity: "high",
              confidence: 0.9,
              start: match.index,
              end: match.index + match[0].length,
              safePreview: "Monto confidencial oculto",
              explanation:
                "El monto aparece junto a lenguaje financiero y confidencial.",
              suggestedReplacement: "[CONFIDENTIAL_AMOUNT]",
            }),
          ],
    );
  }
}
