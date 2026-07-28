import { useEffect, useRef } from "react";
import { FindingsList } from "./FindingsList";
import type { DecisionModalInput, UserDecision } from "./showDecisionModal";

interface WarningModalProps extends DecisionModalInput {
  readonly onDecision: (decision: UserDecision) => void;
}

export function WarningModal({
  decision,
  score,
  findings,
  redactedText,
  allowCriticalOverride = false,
  technicalError = false,
  originalMayBeSent = false,
  onDecision,
}: WarningModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const blocked = decision === "BLOCK";

  useEffect(() => {
    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    dialogRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
    return () => previousFocus?.focus();
  }, []);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onDecision(blocked || technicalError ? "review" : "cancel");
      return;
    }

    if (event.key !== "Tab") return;
    const controls = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>("button, summary"),
    ).filter(
      (element) =>
        element.tagName === "SUMMARY" ||
        element.closest("details:not([open])") === null,
    );
    const first = controls[0];
    const last = controls.at(-1);
    if (first === undefined || last === undefined) return;

    if (event.shiftKey && event.target === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && event.target === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const title = technicalError
    ? "No pudimos verificar este envío"
    : blocked
      ? "Envío bloqueado"
      : "Encontramos información sensible";
  const description = technicalError
    ? originalMayBeSent
      ? "El análisis local encontró un error. Podés volver al mensaje o decidir enviar el original."
      : "El análisis local encontró un error después de detectar contenido crítico. El envío permanece bloqueado."
    : blocked
      ? "Detectamos información que podría permitir acceso o causar una filtración."
      : "Podés protegerla y seguir usando el chat.";

  return (
    <div className="modal-layer">
      <div
        ref={dialogRef}
        className={`decision-modal decision-modal--${decision.toLowerCase()}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="privacy-guard-title"
        aria-describedby="privacy-guard-description"
        onKeyDown={handleKeyDown}
      >
        <div className="risk-rail" aria-label={`Riesgo ${score} de 100`}>
          <span>{score}</span>
          <small>{technicalError ? "estado" : "riesgo"}</small>
        </div>

        <div className="modal-content">
          <header className="modal-header">
            <span className="modal-kicker">
              {technicalError
                ? "Error local"
                : blocked
                  ? "Protección crítica"
                  : "Revisión rápida"}
            </span>
            <h2 id="privacy-guard-title">{title}</h2>
            <p id="privacy-guard-description">{description}</p>
          </header>

          {technicalError ? null : (
            <>
              <FindingsList findings={findings} />
              <section className="safe-preview" aria-label="Versión segura">
                <span>Versión segura</span>
                <p>{redactedText}</p>
              </section>
            </>
          )}

          <div className="modal-actions">
            {technicalError ? (
              <>
                <ActionButton
                  kind="primary"
                  action="review"
                  onDecision={onDecision}
                >
                  Volver al mensaje
                </ActionButton>
                {originalMayBeSent ? (
                  <ActionButton
                    kind="quiet"
                    action="send-original"
                    onDecision={onDecision}
                  >
                    Enviar original
                  </ActionButton>
                ) : null}
              </>
            ) : (
              <>
                <ActionButton
                  kind="primary"
                  action="redact"
                  onDecision={onDecision}
                >
                  {blocked ? "Eliminar y continuar" : "Anonimizar y enviar"}
                </ActionButton>
                <ActionButton
                  kind="secondary"
                  action="review"
                  onDecision={onDecision}
                >
                  {blocked ? "Volver al mensaje" : "Revisar"}
                </ActionButton>
                {blocked ? (
                  <ActionButton
                    kind="quiet"
                    action="copy-safe"
                    onDecision={onDecision}
                  >
                    Copiar versión segura
                  </ActionButton>
                ) : (
                  <>
                    <ActionButton
                      kind="quiet"
                      action="send-original"
                      onDecision={onDecision}
                    >
                      Enviar original
                    </ActionButton>
                    <ActionButton
                      kind="quiet"
                      action="cancel"
                      onDecision={onDecision}
                    >
                      Cancelar
                    </ActionButton>
                  </>
                )}
              </>
            )}
          </div>

          {!technicalError && blocked && allowCriticalOverride ? (
            <details className="critical-override">
              <summary>Opciones avanzadas</summary>
              <ActionButton
                kind="quiet"
                action="send-original"
                onDecision={onDecision}
              >
                Enviar original bajo mi responsabilidad
              </ActionButton>
            </details>
          ) : null}
        </div>
      </div>
    </div>
  );
}

interface ActionButtonProps {
  readonly kind: "primary" | "secondary" | "quiet";
  readonly action: UserDecision;
  readonly onDecision: (decision: UserDecision) => void;
  readonly children: React.ReactNode;
}

function ActionButton({
  kind,
  action,
  onDecision,
  children,
}: ActionButtonProps) {
  return (
    <button
      className={`button button--${kind}`}
      data-action={action}
      onClick={() => {
        onDecision(action);
      }}
    >
      {children}
    </button>
  );
}
