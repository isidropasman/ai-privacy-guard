import { describe, expect, test } from "vitest";
import {
  defaultSettings,
  SettingsRepository,
  type SettingsStorage,
} from "../../../src/storage/SettingsRepository";

class MemoryStorage implements SettingsStorage {
  private values: Record<string, unknown> = {};

  async get(key: string): Promise<Record<string, unknown>> {
    return { [key]: this.values[key] };
  }

  async set(values: Record<string, unknown>): Promise<void> {
    this.values = { ...this.values, ...values };
  }
}

describe("SettingsRepository", () => {
  test("returns privacy-safe defaults for missing storage", async () => {
    const repository = new SettingsRepository(new MemoryStorage());

    await expect(repository.get()).resolves.toEqual(defaultSettings);
  });

  test("normalizes malformed external storage values", async () => {
    const storage = new MemoryStorage();
    await storage.set({
      settings: {
        warningsEnabled: "yes",
        financialDetectionEnabled: false,
        strictSecrets: true,
        confidentialTerms: [" ACME ", 12, "", "ACME"],
        counters: {
          allowedCount: 2,
          warnedCount: -4,
          blockedCount: "3",
          redactedCount: 1,
        },
      },
    });

    const settings = await new SettingsRepository(storage).get();

    expect(settings).toEqual({
      warningsEnabled: true,
      financialDetectionEnabled: false,
      strictSecrets: true,
      confidentialTerms: ["ACME"],
      counters: {
        allowedCount: 2,
        warnedCount: 0,
        blockedCount: 0,
        redactedCount: 1,
      },
    });
  });

  test("stores only validated settings and increments aggregate counters", async () => {
    const repository = new SettingsRepository(new MemoryStorage());
    await repository.save({
      ...defaultSettings,
      confidentialTerms: ["Proyecto Cóndor"],
    });

    await repository.incrementCounter("warnedCount");

    await expect(repository.get()).resolves.toMatchObject({
      confidentialTerms: ["Proyecto Cóndor"],
      counters: { warnedCount: 1 },
    });
  });
});
