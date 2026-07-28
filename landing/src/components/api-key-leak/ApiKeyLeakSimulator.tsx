import "./ApiKeyLeakSimulator.css";

const REAL_KEY = "sk-proj-7hK2ncQaU4mLxV...aQ9f";
const PLACEHOLDER_KEY = "[OPENAI_API_KEY]";

function ComputerIcon() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <rect x="4" y="6" width="24" height="16" rx="2" />
      <line x1="16" y1="22" x2="16" y2="26" />
      <line x1="10" y1="27" x2="22" y2="27" />
    </svg>
  );
}

function ServerIcon() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <rect x="4" y="4" width="24" height="10" rx="2.4" />
      <rect x="4" y="18" width="24" height="10" rx="2.4" />
      <line x1="8" y1="9" x2="8" y2="9" />
      <line x1="12" y1="9" x2="12" y2="9" />
      <line x1="16" y1="9" x2="16" y2="9" />
      <circle cx="24" cy="9" r="1.5" fill="currentColor" stroke="none" />
      <line x1="8" y1="23" x2="8" y2="23" />
      <line x1="12" y1="23" x2="12" y2="23" />
      <line x1="16" y1="23" x2="16" y2="23" />
      <circle cx="24" cy="23" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function KeyIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="8" cy="12" r="4" />
      <line x1="12" y1="12" x2="21" y2="12" />
      <line x1="17" y1="12" x2="17" y2="16" />
      <line x1="20" y1="12" x2="20" y2="15" />
    </svg>
  );
}

interface LeakLaneProps {
  readonly variant: "risk" | "safe";
  readonly label: string;
  readonly caption: string;
}

function LeakLane({ variant, label, caption }: LeakLaneProps) {
  const isSafe = variant === "safe";

  return (
    <div className={`leak-lane leak-lane--${variant}`}>
      <div className="leak-lane__header">
        <span className={`leak-lane__badge leak-lane__badge--${variant}`}>
          {isSafe ? "Frontera protegida" : "Frontera abierta"}
        </span>
        <strong>{label}</strong>
      </div>

      <div className="leak-stage" aria-hidden="true">
        <div className="leak-node leak-node--computer">
          <ComputerIcon />
        </div>

        <div className="leak-track">
          {isSafe && (
            <img
              className="leak-avatar"
              src="/mascot/security-genie-redact.webp"
              alt=""
              width="40"
              height="40"
            />
          )}

          <div className="leak-packet">
            <code className="leak-packet__text leak-packet__text--before">
              {REAL_KEY}
            </code>
            {isSafe && (
              <code className="leak-packet__text leak-packet__text--after">
                {PLACEHOLDER_KEY}
              </code>
            )}
          </div>

          <div className="leak-reply">Respuesta ✓</div>
        </div>

        <div className="leak-node leak-node--server">
          <ServerIcon />
          {!isSafe && (
            <span className="leak-server__stored">
              <KeyIcon />
            </span>
          )}
        </div>
      </div>

      <p className="leak-lane__caption">{caption}</p>
    </div>
  );
}

export function ApiKeyLeakSimulator() {
  return (
    <section className="leak-simulator" aria-labelledby="leak-simulator-title">
      <div className="leak-simulator__heading">
        <div>
          <p className="eyebrow">Fuga de credenciales</p>
          <h2 id="leak-simulator-title">
            Tus API keys quedan guardadas en los servidores de tu proveedor.
          </h2>
        </div>
        <p>
          Cuando pegás una clave en un prompt, viaja como cualquier otro
          texto. Así se ve la diferencia en cada extremo de la conexión.
        </p>
      </div>

      <div className="leak-lanes">
        <LeakLane
          variant="risk"
          label="Sin Redacta"
          caption="La clave real llega al proveedor y puede quedar guardada en sus logs de retención."
        />
        <LeakLane
          variant="safe"
          label="Con Redacta"
          caption="Redacta reemplaza la clave por un placeholder antes de salir del navegador. Al proveedor nunca llega el valor real."
        />
      </div>
    </section>
  );
}
