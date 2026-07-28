export interface InterventionCounters {
  readonly allowedCount: number;
  readonly warnedCount: number;
  readonly blockedCount: number;
  readonly redactedCount: number;
}

export type CounterKey = keyof InterventionCounters;

export interface PrivacyGuardSettings {
  readonly warningsEnabled: boolean;
  readonly financialDetectionEnabled: boolean;
  readonly strictSecrets: boolean;
  readonly confidentialTerms: readonly string[];
  readonly counters: InterventionCounters;
}

export interface SettingsStorage {
  get(key: string): Promise<Record<string, unknown>>;
  set(values: Record<string, unknown>): Promise<void>;
}

export const defaultSettings: PrivacyGuardSettings = {
  warningsEnabled: true,
  financialDetectionEnabled: true,
  strictSecrets: true,
  confidentialTerms: [],
  counters: {
    allowedCount: 0,
    warnedCount: 0,
    blockedCount: 0,
    redactedCount: 0,
  },
};

export class SettingsRepository {
  constructor(private readonly storage: SettingsStorage) {}

  async get(): Promise<PrivacyGuardSettings> {
    const values = await this.storage.get("settings");
    return normalizeSettings(values.settings);
  }

  async save(settings: PrivacyGuardSettings): Promise<void> {
    await this.storage.set({ settings: normalizeSettings(settings) });
  }

  async incrementCounter(counter: CounterKey): Promise<void> {
    const current = await this.get();
    await this.save({
      ...current,
      counters: {
        ...current.counters,
        [counter]: current.counters[counter] + 1,
      },
    });
  }
}

function normalizeSettings(value: unknown): PrivacyGuardSettings {
  if (!isRecord(value)) {
    return structuredClone(defaultSettings);
  }

  const terms = Array.isArray(value.confidentialTerms)
    ? [
        ...new Set(
          value.confidentialTerms.flatMap((term) => {
            if (typeof term !== "string") return [];
            const normalized = ContentSanitizer.normalizeTerm(term);
            return normalized === null ? [] : [normalized];
          }),
        ),
      ]
    : [];
  const counters = isRecord(value.counters) ? value.counters : {};

  return {
    warningsEnabled: booleanOrDefault(
      value.warningsEnabled,
      defaultSettings.warningsEnabled,
    ),
    financialDetectionEnabled: booleanOrDefault(
      value.financialDetectionEnabled,
      defaultSettings.financialDetectionEnabled,
    ),
    strictSecrets: booleanOrDefault(
      value.strictSecrets,
      defaultSettings.strictSecrets,
    ),
    confidentialTerms: terms,
    counters: {
      allowedCount: nonNegativeInteger(counters.allowedCount),
      warnedCount: nonNegativeInteger(counters.warnedCount),
      blockedCount: nonNegativeInteger(counters.blockedCount),
      redactedCount: nonNegativeInteger(counters.redactedCount),
    },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function booleanOrDefault(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function nonNegativeInteger(value: unknown): number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0
    ? value
    : 0;
}
import { ContentSanitizer } from "../security/ContentSanitizer";
