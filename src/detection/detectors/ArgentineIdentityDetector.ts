import type {
  DetectionFinding,
  DetectionInput,
  SensitiveDataDetector,
} from "../types";
import { createFinding } from "../finding";

const identityPatterns = [
  {
    category: "dni" as const,
    pattern: /\bDNI\s*(?:N[°º]\s*)?(\d{7,8})\b/gi,
    replacement: "[DNI_REMOVED]",
    explanation: "El texto incluye un DNI.",
  },
  {
    category: "tax-id" as const,
    pattern: /\b(?:CUIT|CUIL)\s*(\d{2}-?\d{8}-?\d)\b/gi,
    replacement: "[TAX_ID_REMOVED]",
    explanation: "El texto incluye un CUIT o CUIL.",
  },
  {
    category: "bank-account" as const,
    pattern: /\bCBU\s*(\d{22})\b/gi,
    replacement: "[BANK_ACCOUNT_REMOVED]",
    explanation: "El texto incluye un CBU.",
  },
  {
    category: "bank-account" as const,
    pattern:
      /\b(?:alias(?:\s+bancario)?)\s*:\s*([a-z0-9]+(?:[.-][a-z0-9]+){2,})\b/gi,
    replacement: "[BANK_ALIAS_REMOVED]",
    explanation: "El texto incluye un alias bancario en contexto explícito.",
  },
] as const;

export class ArgentineIdentityDetector implements SensitiveDataDetector {
  readonly id = "argentine-identity";
  readonly label = "Dato argentino";
  detect(input: DetectionInput): DetectionFinding[] {
    return identityPatterns.flatMap((definition) =>
      [...input.text.matchAll(definition.pattern)].flatMap((match, index) => {
        const value = match[1];
        if (match.index === undefined || value === undefined) return [];
        const start = match.index + match[0].lastIndexOf(value);
        return [
          createFinding({
            detectorId: this.id,
            index,
            category: definition.category,
            severity: "medium",
            confidence: 0.92,
            start,
            end: start + value.length,
            safePreview: `•••• ${value.replace(/\D/g, "").slice(-3)}`,
            explanation: definition.explanation,
            suggestedReplacement: definition.replacement,
          }),
        ];
      }),
    );
  }
}
