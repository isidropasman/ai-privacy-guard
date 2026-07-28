import type {
  DetectionFinding,
  DetectionInput,
  SensitiveDataDetector,
} from "../types";
import { createFinding } from "../finding";

const credentialPatterns = [
  /\b(sk-(?:proj-|ant-)[A-Za-z0-9_-]{12,})\b/g,
  /\b(AKIA[0-9A-Z]{16})\b/g,
  /\b(gh[pousr]_[A-Za-z0-9]{20,})\b/g,
  /\b(xox[baprs]-[A-Za-z0-9-]{12,})\b/g,
  /\b(sk_(?:live|test)_[A-Za-z0-9]{12,})\b/g,
  /\b(AIza[0-9A-Za-z_-]{20,})\b/g,
  /\b(SK[0-9a-fA-F]{32})\b/g,
  /\bBearer\s+([A-Za-z0-9._~+/-]{20,})\b/g,
  /\b(?:[A-Z][A-Z0-9_]*_)?(?:API_KEY|ACCESS_KEY(?:_ID)?|SECRET|TOKEN|PASSWORD)\b["']?\s*[:=]\s*["']?([^\s"',;]{8,})/gi,
] as const;

export class ApiKeyDetector implements SensitiveDataDetector {
  readonly id = "api-key";
  readonly label = "Credencial";
  detect(input: DetectionInput): DetectionFinding[] {
    const ranges = credentialPatterns.flatMap((pattern) =>
      [...input.text.matchAll(pattern)].flatMap((match) => {
        const secret = match[1];
        if (secret === undefined || match.index === undefined) {
          return [];
        }
        const relativeStart = match[0].lastIndexOf(secret);
        return [
          {
            start: match.index + relativeStart,
            end: match.index + relativeStart + secret.length,
          },
        ];
      }),
    );
    const uniqueRanges = ranges
      .sort(
        (left, right) =>
          left.start - right.start ||
          right.end - right.start - (left.end - left.start),
      )
      .filter(
        (range, index, all) =>
          !all
            .slice(0, index)
            .some(
              (selected) =>
                range.start < selected.end && range.end > selected.start,
            ),
      );

    return uniqueRanges.map((range, index) =>
      createFinding({
        detectorId: this.id,
        index,
        category: "credential",
        severity: "critical",
        confidence: 0.99,
        start: range.start,
        end: range.end,
        safePreview: "Credencial oculta",
        explanation:
          "Una credencial podría permitir acceso a sistemas o servicios.",
        suggestedReplacement: "[API_KEY_REMOVED]",
      }),
    );
  }
}
