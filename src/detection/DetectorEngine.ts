import type {
  DetectionFinding,
  DetectionInput,
  SensitiveDataDetector,
} from "./types";

export class DetectorEngine {
  private cachedKey: string | undefined;
  private cachedFindings: readonly DetectionFinding[] = [];

  constructor(private readonly detectors: readonly SensitiveDataDetector[]) {}

  detect(input: DetectionInput): DetectionFinding[] {
    const key = hashInput(input);
    if (key === this.cachedKey) {
      return [...this.cachedFindings];
    }

    const findings = this.detectors
      .flatMap((detector) => detector.detect(input))
      .sort((left, right) => left.start - right.start || right.end - left.end);

    this.cachedKey = key;
    this.cachedFindings = findings;
    return [...findings];
  }
}

function hashInput(input: DetectionInput): string {
  const value = `${input.text}\u0000${input.configuredTerms.join("\u0000")}`;
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return `${value.length}:${hash >>> 0}`;
}
