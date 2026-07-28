import {
  limits,
  type TelemetryCounters,
} from "../../packages/contracts/src/index";
import type { RuntimeConfigRepository } from "../config/RuntimeConfigRepository";
import type { EnrollmentRepository } from "../enrollment/EnrollmentRepository";
import type { EventQueueRepository } from "./EventQueueRepository";

export type FlushResult =
  "idle" | "sent" | "retry" | "unauthorized" | "not-enrolled";

export interface EventDeliveryDependencies {
  readonly config: RuntimeConfigRepository;
  readonly enrollment: EnrollmentRepository;
  readonly queue: EventQueueRepository;
  readonly fetchImpl: typeof fetch;
  readonly extensionVersion: string;
}

/**
 * Entrega los eventos encolados.
 *
 * Nunca corre en el camino crítico del envío del usuario: si falla, los
 * eventos quedan en la cola y el reintento lo agenda el background.
 */
export class EventDeliveryService {
  constructor(private readonly dependencies: EventDeliveryDependencies) {}

  async flush(): Promise<FlushResult> {
    const config = await this.dependencies.config.get();
    if (config === null) return "not-enrolled";

    const enrollment = await this.dependencies.enrollment.get();
    if (enrollment === null) return "not-enrolled";

    const pending = await this.dependencies.queue.all();
    if (pending.length === 0) return "idle";

    const batch = pending.slice(0, limits.maxBatchSize);

    let response: Response;
    try {
      response = await this.dependencies.fetchImpl(
        `${config.apiBaseUrl}/v1/events`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${enrollment.token}`,
          },
          body: JSON.stringify({ events: batch }),
        },
      );
    } catch {
      return "retry";
    }

    if (response.status === 401) {
      // El token dejó de ser válido: seguir reintentando sólo acumularía
      // basura y filtraría actividad de una instalación ya revocada.
      await this.dependencies.queue.clear();
      await this.dependencies.enrollment.clear();
      return "unauthorized";
    }

    if (!response.ok) {
      // 4xx distinto de 401 significa que el lote nunca va a ser aceptado.
      // 5xx sí puede recuperarse, así que se conserva.
      if (response.status >= 500) return "retry";
      await this.dependencies.queue.remove(batch.map((event) => event.id));
      return "sent";
    }

    await this.dependencies.queue.remove(batch.map((event) => event.id));
    return "sent";
  }

  async sendHeartbeat(counters: TelemetryCounters): Promise<boolean> {
    const config = await this.dependencies.config.get();
    if (config === null) return false;

    const enrollment = await this.dependencies.enrollment.get();
    if (enrollment === null) return false;

    try {
      const response = await this.dependencies.fetchImpl(
        `${config.apiBaseUrl}/v1/heartbeat`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${enrollment.token}`,
          },
          body: JSON.stringify({
            counters,
            extensionVersion: this.dependencies.extensionVersion,
          }),
        },
      );
      return response.ok;
    } catch {
      return false;
    }
  }
}
