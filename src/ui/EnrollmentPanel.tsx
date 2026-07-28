import { useEffect, useState } from "react";
import type {
  EnrollmentActionResult,
  EnrollmentStatus,
  ExtensionMessage,
} from "../messaging/messages";

const localStatus: EnrollmentStatus = {
  configured: false,
  companyName: null,
  companyId: null,
  enrollmentCode: null,
  connected: false,
  userEmail: null,
  pendingEvents: 0,
};

async function send<Response>(message: ExtensionMessage): Promise<Response> {
  const response: unknown = await browser.runtime.sendMessage(message);
  return response as Response;
}

/**
 * Si el background no responde, la UI cae a "modo local" en vez de romperse.
 * Es el mismo estado que ve un build sin configuración de empresa.
 */
export async function requestStatus(): Promise<EnrollmentStatus> {
  try {
    const status = await send<EnrollmentStatus | undefined>({
      type: "enrollment-status",
    });
    return status ?? localStatus;
  } catch {
    return localStatus;
  }
}

async function requestEnroll(
  code: string,
  email: string,
): Promise<EnrollmentActionResult> {
  return send<EnrollmentActionResult>({ type: "enroll", code, email });
}

async function requestUnenroll(): Promise<EnrollmentActionResult> {
  return send<EnrollmentActionResult>({ type: "unenroll" });
}

export function useEnrollmentStatus() {
  const [status, setStatus] = useState<EnrollmentStatus>();

  useEffect(() => {
    let active = true;
    void requestStatus().then((value) => {
      if (active) setStatus(value);
    });
    return () => {
      active = false;
    };
  }, []);

  return [status, setStatus] as const;
}

export function EnrollmentPanel({
  status,
  onStatusChange,
  variant,
}: {
  readonly status: EnrollmentStatus;
  readonly onStatusChange: (status: EnrollmentStatus) => void;
  readonly variant: "popup" | "welcome";
}) {
  const [code, setCode] = useState(status.enrollmentCode ?? "");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  if (!status.configured) {
    return (
      <section className="enrollment enrollment--local">
        <h2>Modo local</h2>
        <p>
          Este paquete no tiene configuración de empresa. La extensión te
          protege igual, pero no reporta nada a ninguna organización.
        </p>
      </section>
    );
  }

  if (status.connected) {
    return (
      <section className="enrollment enrollment--connected">
        <h2>Conectado</h2>
        <p>
          <strong>{status.companyName}</strong>
          <br />
          {status.userEmail}
        </p>
        {status.pendingEvents > 0 ? (
          <p className="enrollment-pending">
            {status.pendingEvents} evento{status.pendingEvents === 1 ? "" : "s"}{" "}
            en cola, esperando conexión.
          </p>
        ) : null}
        <button
          type="button"
          className="enrollment-secondary"
          disabled={busy}
          onClick={() => {
            setBusy(true);
            void requestUnenroll()
              .then((result) => {
                if (result.ok) onStatusChange(result.status);
              })
              .finally(() => {
                setBusy(false);
              });
          }}
        >
          Desconectar
        </button>
      </section>
    );
  }

  const needsCode = status.enrollmentCode === null;

  return (
    <form
      className={`enrollment enrollment--${variant}`}
      onSubmit={(event) => {
        event.preventDefault();
        setError(undefined);

        if (needsCode && code.trim().length === 0) {
          setError("Ingresá el código de tu empresa.");
          return;
        }
        if (!email.includes("@")) {
          setError("Ingresá tu email corporativo.");
          return;
        }

        setBusy(true);
        void requestEnroll(code.trim(), email.trim())
          .then((result) => {
            if (result.ok) {
              onStatusChange(result.status);
              return;
            }
            setError(result.error);
          })
          .finally(() => {
            setBusy(false);
          });
      }}
    >
      <h2>Conectá tu cuenta</h2>
      {status.companyName === null ? null : (
        <p className="enrollment-company">{status.companyName}</p>
      )}

      {needsCode ? (
        <label>
          Código de enrolamiento
          <input
            value={code}
            onChange={(event) => setCode(event.currentTarget.value)}
            placeholder="ANDE-7F3K-2NQ8"
            autoComplete="off"
          />
        </label>
      ) : null}

      <label>
        Email corporativo
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.currentTarget.value)}
          placeholder="nombre@empresa.com"
          autoComplete="email"
        />
      </label>

      <p className="enrollment-notice">
        Al conectarte, {status.companyName ?? "tu empresa"} va a ver qué reglas
        se activaron, cuándo y en qué herramienta. Nunca ve tus prompts ni el
        texto detectado.
      </p>

      {error === undefined ? null : (
        <p className="enrollment-error" role="alert">
          {error}
        </p>
      )}

      <button type="submit" className="enrollment-primary" disabled={busy}>
        {busy ? "Conectando…" : "Conectar"}
      </button>

      <p className="enrollment-optional">
        Podés usar la extensión sin conectarte: te protege igual.
      </p>
    </form>
  );
}
