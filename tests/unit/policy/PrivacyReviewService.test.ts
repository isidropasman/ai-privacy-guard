import { describe, expect, test, vi } from "vitest";
import { PrivacyReviewService } from "../../../src/policy/PrivacyReviewService";
import {
  defaultSettings,
  SettingsRepository,
  type SettingsStorage,
} from "../../../src/storage/SettingsRepository";
import type { UserDecision } from "../../../src/ui/showDecisionModal";

class MemoryStorage implements SettingsStorage {
  values: Record<string, unknown> = {};

  async get(key: string): Promise<Record<string, unknown>> {
    return { [key]: this.values[key] };
  }

  async set(values: Record<string, unknown>): Promise<void> {
    this.values = { ...this.values, ...values };
  }
}

class FailingStorage implements SettingsStorage {
  async get(): Promise<Record<string, unknown>> {
    return Promise.reject(new Error("storage unavailable"));
  }

  async set(): Promise<void> {
    return Promise.reject(new Error("storage unavailable"));
  }
}

async function createService(
  decision: UserDecision,
  settings = defaultSettings,
) {
  const storage = new MemoryStorage();
  const repository = new SettingsRepository(storage);
  await repository.save(settings);
  const decide = vi.fn(async () => decision);
  const copy = vi.fn(async (_text: string) => undefined);
  return {
    service: new PrivacyReviewService(repository, decide, copy),
    repository,
    decide,
    copy,
  };
}

describe("PrivacyReviewService", () => {
  test("allows a safe prompt without opening UI", async () => {
    const harness = await createService("cancel");

    const result = await harness.service.review(
      "Explicame de manera sencilla qué es Kubernetes.",
    );

    expect(result).toEqual({ kind: "allow" });
    expect(harness.decide).not.toHaveBeenCalled();
    expect((await harness.repository.get()).counters.allowedCount).toBe(1);
  });

  test("returns an anonymized warning prompt after one-click protection", async () => {
    const harness = await createService("redact");

    const result = await harness.service.review(
      "Ayudame a escribirle a Juan Pérez. Su email es juan.perez@example.com.",
    );

    expect(result).toEqual({
      kind: "allow",
      replacementText:
        "Ayudame a escribirle a [PERSON_NAME]. Su email es [EMAIL_CONTACT].",
    });
    expect(harness.decide).toHaveBeenCalledOnce();
    expect((await harness.repository.get()).counters.redactedCount).toBe(1);
  });

  test("blocks a critical fixture when strict mode is active", async () => {
    const harness = await createService("send-original");

    const result = await harness.service.review(
      "OPENAI_API_KEY=sk-proj-example-for-testing",
    );

    expect(result).toEqual({ kind: "interrupt" });
    expect(harness.decide).toHaveBeenCalledWith(
      expect.objectContaining({
        decision: "BLOCK",
        score: 100,
        allowCriticalOverride: false,
      }),
    );
    expect((await harness.repository.get()).counters.blockedCount).toBe(1);
  });

  test("copies only the safe version and keeps the original blocked", async () => {
    const harness = await createService("copy-safe");

    const result = await harness.service.review(
      "OPENAI_API_KEY=sk-proj-example-for-testing",
    );

    expect(result).toEqual({ kind: "interrupt" });
    expect(harness.copy).toHaveBeenCalledWith(
      "OPENAI_API_KEY=[API_KEY_REMOVED]",
    );
  });

  test("allows a technical override only when detection never completed", async () => {
    const service = new PrivacyReviewService(
      new SettingsRepository(new FailingStorage()),
      async () => "cancel",
      async () => undefined,
    );

    await expect(service.review("unknown prompt")).resolves.toEqual({
      kind: "error",
      originalMayBeSent: true,
    });
  });

  test("keeps a recognizable credential blocked when storage fails", async () => {
    const service = new PrivacyReviewService(
      new SettingsRepository(new FailingStorage()),
      async () => "send-original",
      async () => undefined,
    );

    await expect(
      service.review("OPENAI_API_KEY=sk-proj-example-for-testing"),
    ).resolves.toEqual({
      kind: "error",
      originalMayBeSent: false,
    });
  });

  test("keeps a critical finding fail-safe when copying fails", async () => {
    const storage = new MemoryStorage();
    const repository = new SettingsRepository(storage);
    await repository.save(defaultSettings);
    const service = new PrivacyReviewService(
      repository,
      async () => "copy-safe",
      async () => Promise.reject(new Error("clipboard unavailable")),
    );

    await expect(
      service.review("OPENAI_API_KEY=sk-proj-example-for-testing"),
    ).resolves.toEqual({
      kind: "error",
      originalMayBeSent: false,
    });
  });
});
