import {
  limits,
  type TelemetryEvent,
} from "../../packages/contracts/src/index";

export interface QueueStorage {
  get(key: string): Promise<Record<string, unknown>>;
  set(values: Record<string, unknown>): Promise<void>;
}

const queueKey = "telemetryQueue";
const droppedKey = "telemetryDropped";

/**
 * Cola acotada de eventos pendientes de entrega.
 *
 * Al llenarse descarta los más viejos y lleva la cuenta de descartes, que
 * viaja en el heartbeat: una instalación que perdió eventos tiene que poder
 * decirlo en vez de aparentar que nunca pasó nada.
 */
export class EventQueueRepository {
  constructor(
    private readonly storage: QueueStorage,
    private readonly maxSize: number = limits.maxQueueSize,
  ) {}

  async enqueue(event: TelemetryEvent): Promise<void> {
    const current = await this.all();
    const next = [...current, event];
    const overflow = Math.max(0, next.length - this.maxSize);

    if (overflow > 0) {
      await this.addDropped(overflow);
    }

    await this.storage.set({ [queueKey]: next.slice(overflow) });
  }

  async all(): Promise<TelemetryEvent[]> {
    try {
      const values = await this.storage.get(queueKey);
      const stored = values[queueKey];
      return Array.isArray(stored) ? (stored as TelemetryEvent[]) : [];
    } catch {
      return [];
    }
  }

  /** Quita por id: la entrega puede aceptar parte del lote y rechazar el resto. */
  async remove(ids: readonly string[]): Promise<void> {
    const removing = new Set(ids);
    const remaining = (await this.all()).filter(
      (event) => !removing.has(event.id),
    );
    await this.storage.set({ [queueKey]: remaining });
  }

  async clear(): Promise<void> {
    await this.storage.set({ [queueKey]: [] });
  }

  async droppedCount(): Promise<number> {
    try {
      const values = await this.storage.get(droppedKey);
      const stored = values[droppedKey];
      return typeof stored === "number" && Number.isSafeInteger(stored)
        ? stored
        : 0;
    } catch {
      return 0;
    }
  }

  private async addDropped(count: number): Promise<void> {
    const current = await this.droppedCount();
    await this.storage.set({ [droppedKey]: current + count });
  }
}
