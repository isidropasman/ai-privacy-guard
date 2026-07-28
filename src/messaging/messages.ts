import type { SubmissionOutcome } from "../telemetry/EventFactory";

/**
 * Mensajes tipados entre content script, popup y background.
 *
 * El token de instalación nunca viaja en estos mensajes: el content script se
 * ejecuta dentro del DOM del proveedor, junto a código de terceros.
 */
export type ExtensionMessage =
  | { readonly type: "submission-outcome"; readonly outcome: SubmissionOutcome }
  | { readonly type: "enrollment-status" }
  | {
      readonly type: "enroll";
      readonly code: string;
      readonly email: string;
    }
  | { readonly type: "unenroll" }
  | { readonly type: "flush-events" };

export interface EnrollmentStatus {
  readonly configured: boolean;
  readonly companyName: string | null;
  readonly companyId: string | null;
  readonly enrollmentCode: string | null;
  readonly connected: boolean;
  readonly userEmail: string | null;
  readonly pendingEvents: number;
}

export type EnrollmentActionResult =
  | { readonly ok: true; readonly status: EnrollmentStatus }
  | { readonly ok: false; readonly error: string };

export function isExtensionMessage(value: unknown): value is ExtensionMessage {
  if (typeof value !== "object" || value === null) return false;
  const message = value as Record<string, unknown>;
  return (
    typeof message.type === "string" &&
    [
      "submission-outcome",
      "enrollment-status",
      "enroll",
      "unenroll",
      "flush-events",
    ].includes(message.type)
  );
}
