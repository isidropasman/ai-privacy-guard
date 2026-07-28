import { beforeEach, describe, expect, test } from "vitest";
import type { TelemetryEvent } from "../../../packages/contracts/src/index";
import { EventQueueRepository } from "../../../src/telemetry/EventQueueRepository";

class MemoryStorage {
  private readonly values = new Map<string, unknown>();

  async get(key: string): Promise<Record<string, unknown>> {
    return this.values.has(key) ? { [key]: this.values.get(key) } : {};
  }

  async set(values: Record<string, unknown>): Promise<void> {
    for (const [key, value] of Object.entries(values)) {
      this.values.set(key, value);
    }
  }
}

function event(id: string): TelemetryEvent {
  return {
    id,
    occurredAt: "2026-07-28T18:00:00.000Z",
    provider: "ChatGPT",
    decision: "BLOCK",
    resolution: "blocked",
    topSeverity: "critical",
    score: 100,
    durationMs: 10,
    rules: [
      {
        ruleId: "api-key",
        ruleSource: "base",
        category: "credential",
        severity: "critical",
      },
    ],
  };
}

describe("EventQueueRepository", () => {
  let storage: MemoryStorage;

  beforeEach(() => {
    storage = new MemoryStorage();
  });

  test("mantiene el orden de llegada", async () => {
    const queue = new EventQueueRepository(storage);
    await queue.enqueue(event("a"));
    await queue.enqueue(event("b"));
    await queue.enqueue(event("c"));

    expect((await queue.all()).map((item) => item.id)).toEqual(["a", "b", "c"]);
  });

  test("al llenarse descarta los más viejos y los cuenta", async () => {
    const queue = new EventQueueRepository(storage, 3);
    for (const id of ["a", "b", "c", "d", "e"]) {
      await queue.enqueue(event(id));
    }

    expect((await queue.all()).map((item) => item.id)).toEqual(["c", "d", "e"]);
    expect(await queue.droppedCount()).toBe(2);
  });

  test("quita por id sin tocar el resto", async () => {
    const queue = new EventQueueRepository(storage);
    for (const id of ["a", "b", "c"]) await queue.enqueue(event(id));

    await queue.remove(["a", "c"]);

    expect((await queue.all()).map((item) => item.id)).toEqual(["b"]);
  });

  test("devuelve vacío si el almacenamiento tiene basura", async () => {
    await storage.set({ telemetryQueue: "no soy un array" });
    const queue = new EventQueueRepository(storage);

    expect(await queue.all()).toEqual([]);
  });
});
