import type {
  DetectionFinding,
  DetectionInput,
  SensitiveDataDetector,
} from "../types";
import { createFinding } from "../finding";

export class ConfidentialKeywordDetector implements SensitiveDataDetector {
  readonly id = "confidential-keyword";
  readonly label = "Término confidencial";
  detect(input: DetectionInput): DetectionFinding[] {
    return input.configuredTerms
      .flatMap((term, termIndex) => {
        const normalizedTerm = term.trim();
        if (normalizedTerm.length === 0) return [];
        const pattern = new RegExp(escapeRegExp(normalizedTerm), "giu");
        return [...input.text.matchAll(pattern)].flatMap((match, matchIndex) =>
          match.index === undefined
            ? []
            : [
                createFinding({
                  detectorId: this.id,
                  index: termIndex * 1000 + matchIndex,
                  category: "confidential-term",
                  severity: "medium",
                  confidence: 1,
                  start: match.index,
                  end: match.index + match[0].length,
                  safePreview: "Término configurado oculto",
                  explanation:
                    "Coincide con un término confidencial configurado localmente.",
                  suggestedReplacement: replacementForTerm(normalizedTerm),
                }),
              ],
        );
      })
      .sort((left, right) => left.start - right.start);
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function replacementForTerm(term: string): string {
  if (/^cliente\s+/iu.test(term)) return "Cliente [CLIENT_NAME]";
  if (/^proyecto\s+/iu.test(term)) return "[PROJECT_NAME]";
  if (/[-_/]/u.test(term)) return "[INTERNAL_TERM]";
  return "[CONFIDENTIAL_TERM]";
}
