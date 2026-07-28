import type {
  DetectionFinding,
  FindingSeverity,
  SensitiveCategory,
} from "./types";

interface FindingFields {
  readonly detectorId: string;
  readonly index: number;
  readonly category: SensitiveCategory;
  readonly severity: FindingSeverity;
  readonly confidence: number;
  readonly start: number;
  readonly end: number;
  readonly safePreview: string;
  readonly explanation: string;
  readonly suggestedReplacement: string;
}

export function createFinding(fields: FindingFields): DetectionFinding {
  return {
    id: `${fields.detectorId}-${fields.start}-${fields.end}-${fields.index}`,
    detectorId: fields.detectorId,
    category: fields.category,
    severity: fields.severity,
    confidence: fields.confidence,
    start: fields.start,
    end: fields.end,
    safePreview: fields.safePreview,
    explanation: fields.explanation,
    suggestedReplacement: fields.suggestedReplacement,
  };
}
