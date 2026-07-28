import type {
  DetectionFinding,
  DetectionInput,
  SensitiveDataDetector,
} from "../types";
import { createFinding } from "../finding";

const privateKeyPattern =
  /-----BEGIN (?:RSA |OPENSSH )?PRIVATE KEY-----[\s\S]*?(?:-----END (?:RSA |OPENSSH )?PRIVATE KEY-----|$)/g;

export class PrivateKeyDetector implements SensitiveDataDetector {
  readonly id = "private-key";
  readonly label = "Clave privada";
  detect(input: DetectionInput): DetectionFinding[] {
    return [...input.text.matchAll(privateKeyPattern)].flatMap(
      (match, index) =>
        match.index === undefined
          ? []
          : [
              createFinding({
                detectorId: this.id,
                index,
                category: "private-key",
                severity: "critical",
                confidence: 1,
                start: match.index,
                end: match.index + match[0].length,
                safePreview: "Clave privada oculta",
                explanation:
                  "Una clave privada permite autenticarse como su propietario.",
                suggestedReplacement: "[PRIVATE_KEY_REMOVED]",
              }),
            ],
    );
  }
}
