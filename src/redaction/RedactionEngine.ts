import type { DetectionFinding, SensitiveCategory } from "../detection/types";

export interface AppliedReplacement {
  readonly start: number;
  readonly end: number;
  readonly replacement: string;
  readonly category: SensitiveCategory;
}

export interface RedactionResult {
  readonly text: string;
  readonly replacements: readonly AppliedReplacement[];
}

export class RedactionEngine {
  redact(text: string, findings: readonly DetectionFinding[]): RedactionResult {
    const validFindings = findings.filter(
      (finding) =>
        Number.isInteger(finding.start) &&
        Number.isInteger(finding.end) &&
        finding.start >= 0 &&
        finding.end > finding.start &&
        finding.end <= text.length,
    );
    const selected: DetectionFinding[] = [];

    for (const finding of [...validFindings].sort(compareSpecificity)) {
      const overlaps = selected.some(
        (current) => finding.start < current.end && finding.end > current.start,
      );
      if (!overlaps) selected.push(finding);
    }

    const replacements = selected
      .sort((left, right) => left.start - right.start)
      .map((finding) => ({
        start: finding.start,
        end: finding.end,
        replacement: finding.suggestedReplacement,
        category: finding.category,
      }));
    let redactedText = text;

    for (const replacement of [...replacements].reverse()) {
      redactedText =
        redactedText.slice(0, replacement.start) +
        replacement.replacement +
        redactedText.slice(replacement.end);
    }

    return { text: redactedText, replacements };
  }
}

const severityRank: Record<DetectionFinding["severity"], number> = {
  low: 0,
  medium: 1,
  high: 2,
  critical: 3,
};

function compareSpecificity(
  left: DetectionFinding,
  right: DetectionFinding,
): number {
  return (
    severityRank[right.severity] - severityRank[left.severity] ||
    right.confidence - left.confidence ||
    right.end - right.start - (left.end - left.start) ||
    left.start - right.start
  );
}
