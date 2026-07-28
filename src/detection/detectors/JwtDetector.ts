import type {
  DetectionFinding,
  DetectionInput,
  SensitiveDataDetector,
} from "../types";
import { createFinding } from "../finding";

const jwtPattern =
  /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/g;

export class JwtDetector implements SensitiveDataDetector {
  readonly id = "jwt";
  readonly label = "Token JWT";
  detect(input: DetectionInput): DetectionFinding[] {
    const criticalContext =
      /\b(?:authorization|bearer|access[_ -]?token)\b/i.test(input.text);

    return [...input.text.matchAll(jwtPattern)].flatMap((match, index) =>
      match.index === undefined
        ? []
        : [
            createFinding({
              detectorId: this.id,
              index,
              category: "jwt",
              severity: criticalContext ? "critical" : "high",
              confidence: 0.95,
              start: match.index,
              end: match.index + match[0].length,
              safePreview: "JWT oculto",
              explanation:
                "El token tiene estructura JWT y puede contener autorización.",
              suggestedReplacement: "[JWT_REMOVED]",
            }),
          ],
    );
  }
}
