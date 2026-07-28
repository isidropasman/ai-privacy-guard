import { RuntimeConfigRepository } from "../src/config/RuntimeConfigRepository";
import { EnrollmentRepository } from "../src/enrollment/EnrollmentRepository";
import { EnrollmentService } from "../src/enrollment/EnrollmentService";
import {
  isExtensionMessage,
  type EnrollmentActionResult,
  type EnrollmentStatus,
  type ExtensionMessage,
} from "../src/messaging/messages";
import { SettingsRepository } from "../src/storage/SettingsRepository";
import { computeBackoffMs } from "../src/telemetry/backoff";
import { EventDeliveryService } from "../src/telemetry/EventDeliveryService";
import { createTelemetryEvent } from "../src/telemetry/EventFactory";
import { EventQueueRepository } from "../src/telemetry/EventQueueRepository";

const flushAlarm = "privacy-guard-flush";
const heartbeatAlarm = "privacy-guard-heartbeat";

export default defineBackground(() => {
  const extensionVersion = browser.runtime.getManifest().version;
  const settingsRepository = new SettingsRepository(browser.storage.local);
  const configRepository = new RuntimeConfigRepository();
  const enrollmentRepository = new EnrollmentRepository(browser.storage.local);
  const queueRepository = new EventQueueRepository(browser.storage.local);

  const delivery = new EventDeliveryService({
    config: configRepository,
    enrollment: enrollmentRepository,
    queue: queueRepository,
    fetchImpl: (...args) => fetch(...args),
    extensionVersion,
  });

  const enrollmentService = new EnrollmentService({
    repository: enrollmentRepository,
    fetchImpl: (...args) => fetch(...args),
    extensionVersion,
    now: () => new Date(),
  });

  let failedAttempts = 0;

  const scheduleRetry = () => {
    failedAttempts += 1;
    void browser.alarms.create(flushAlarm, {
      when: Date.now() + computeBackoffMs(failedAttempts),
    });
  };

  const flush = async (): Promise<void> => {
    const result = await delivery.flush();
    if (result === "retry") {
      scheduleRetry();
      return;
    }
    failedAttempts = 0;
    if (result === "sent") {
      // Puede quedar más de un lote pendiente en la cola.
      void browser.alarms.create(flushAlarm, { when: Date.now() + 2_000 });
    }
  };

  const readStatus = async (): Promise<EnrollmentStatus> => {
    const config = await configRepository.get();
    const enrollment = await enrollmentRepository.get();
    const pending = await queueRepository.all();

    return {
      configured: config !== null,
      companyName: enrollment?.companyName ?? config?.companyName ?? null,
      companyId: enrollment?.companyId ?? config?.companyId ?? null,
      enrollmentCode: config?.enrollmentCode ?? null,
      connected: enrollment !== null,
      userEmail: enrollment?.userEmail ?? null,
      pendingEvents: pending.length,
    };
  };

  browser.runtime.onInstalled.addListener((details) => {
    void settingsRepository.get().then((settings) => {
      void settingsRepository.save(settings);
    });

    if (details.reason !== "install") return;

    // La pantalla de conexión va a buscar al usuario: Chrome no fija el ícono
    // de la extensión, así que esperar a que abra el popup pierde enrolamientos.
    void configRepository.get().then((config) => {
      if (config === null) return;
      void browser.tabs.create({
        url: browser.runtime.getURL("/welcome.html"),
      });
    });
  });

  browser.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === flushAlarm) {
      void flush();
      return;
    }
    if (alarm.name === heartbeatAlarm) {
      void sendHeartbeat(settingsRepository, queueRepository, delivery);
    }
  });

  void browser.alarms.create(heartbeatAlarm, { periodInMinutes: 30 });

  browser.runtime.onMessage.addListener(
    (message: unknown, sender, sendResponse) => {
      if (!isExtensionMessage(message)) return false;

      // Sólo las páginas propias de la extensión pueden enrolar o desenrolar.
      // El content script convive con el DOM del proveedor y no debe poder
      // tocar credenciales.
      //
      // El discriminador es el origen, no `sender.tab`: la pestaña de
      // bienvenida es una pestaña igual que cualquier otra, así que mirar
      // `tab` bloquearía justamente el enrolamiento que queremos permitir.
      const extensionOrigin = browser.runtime.getURL("/");
      const fromExtensionPage =
        sender.url?.startsWith(extensionOrigin) ?? false;

      void handleMessage(message, fromExtensionPage, {
        configRepository,
        enrollmentService,
        queueRepository,
        readStatus,
        flush,
      }).then(sendResponse);

      return true;
    },
  );
});

interface MessageContext {
  readonly configRepository: RuntimeConfigRepository;
  readonly enrollmentService: EnrollmentService;
  readonly queueRepository: EventQueueRepository;
  readonly readStatus: () => Promise<EnrollmentStatus>;
  readonly flush: () => Promise<void>;
}

async function handleMessage(
  message: ExtensionMessage,
  fromExtensionPage: boolean,
  context: MessageContext,
): Promise<unknown> {
  switch (message.type) {
    case "submission-outcome": {
      const event = createTelemetryEvent(message.outcome);
      if (event === null) return { ok: true };
      await context.queueRepository.enqueue(event);
      void context.flush();
      return { ok: true };
    }

    case "enrollment-status":
      return context.readStatus();

    case "enroll": {
      if (!fromExtensionPage) {
        return { ok: false, error: "Origen no autorizado." };
      }
      const config = await context.configRepository.get();
      if (config === null) {
        return {
          ok: false,
          error: "Este paquete no tiene configuración de empresa.",
        };
      }
      const result = await context.enrollmentService.enroll(
        config,
        message.code,
        message.email,
      );
      if (!result.ok) return { ok: false, error: result.error };
      return {
        ok: true,
        status: await context.readStatus(),
      } satisfies EnrollmentActionResult;
    }

    case "unenroll": {
      if (!fromExtensionPage) {
        return { ok: false, error: "Origen no autorizado." };
      }
      const config = await context.configRepository.get();
      if (config !== null) await context.enrollmentService.unenroll(config);
      return {
        ok: true,
        status: await context.readStatus(),
      } satisfies EnrollmentActionResult;
    }

    case "flush-events":
      await context.flush();
      return { ok: true };
  }
}

async function sendHeartbeat(
  settingsRepository: SettingsRepository,
  queueRepository: EventQueueRepository,
  delivery: EventDeliveryService,
): Promise<void> {
  const settings = await settingsRepository.get();
  const dropped = await queueRepository.droppedCount();
  const { allowedCount, warnedCount, blockedCount, redactedCount } =
    settings.counters;

  await delivery.sendHeartbeat({
    analyzedCount: allowedCount + warnedCount + blockedCount,
    allowedCount,
    warnedCount,
    blockedCount,
    redactedCount,
    droppedCount: dropped,
  });
}
