export type SensitiveCategory =
  | "credential"
  | "private-key"
  | "jwt"
  | "connection-string"
  | "payment-card"
  | "email"
  | "person-name"
  | "phone"
  | "dni"
  | "tax-id"
  | "bank-account"
  | "financial"
  | "confidential-term";

export type FindingSeverity = "low" | "medium" | "high" | "critical";

export interface DetectionInput {
  readonly text: string;
  readonly configuredTerms: readonly string[];
}

export interface DetectionFinding {
  readonly id: string;
  readonly detectorId: string;
  readonly category: SensitiveCategory;
  readonly severity: FindingSeverity;
  readonly confidence: number;
  readonly start: number;
  readonly end: number;
  readonly matchedText?: string;
  readonly safePreview: string;
  readonly explanation: string;
  readonly suggestedReplacement: string;
}

export interface SensitiveDataDetector {
  readonly id: string;
  readonly label: string;
  detect(input: DetectionInput): DetectionFinding[];
}
