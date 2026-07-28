import { useEffect, useRef } from "react";
import { FindingsList } from "../FindingsList";
import type { DecisionModalInput, UserDecision } from "../showDecisionModal";

interface GenieDecisionBubbleProps extends DecisionModalInput {
  readonly onDecision: (decision: UserDecision) => void;
  readonly returnFocus?: HTMLElement | null;
}

export function GenieDecisionBubble({
  decision,
  score,
  findings,
  redactedText,
  allowCriticalOverride = false,
  technicalError = false,
  originalMayBeSent = false,
  onDecision,
  returnFocus,
}: GenieDecisionBubbleProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(
    returnFocus ??
      (document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null),
  );
  const blocked = decision === "BLOCK";

  useEffect(() => {
    const previousFocus = previousFocusRef.current;
    dialogRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
    return () => {
      queueMicrotask(() => previousFocus?.focus());
    };
  }, []);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onDecision(blocked || technicalError ? "review" : "cancel");
      queueMicrotask(() => previousFocusRef.current?.focus());
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
    ? "No pude verificar este envío"
    : blocked
      ? "Este mensaje no puede salir"
      : "Encontré datos sensibles";
  const description = technicalError
    ? originalMayBeSent
      ? "La revisión local falló. Podés volver al mensaje o enviar el original."
      : "La revisión local falló y el envío permanece bloqueado."
    : blocked
      ? "Detecté información que podría permitir acceso o causar una filtración."
      : "Antes de enviarlo, puedo ocultar esta información por vos.";

  return (
    <div
      ref={dialogRef}
      className={`genie-bubble genie-bubble--${decision.toLowerCase()}`}
      data-surface="genie-bubble"
      role="dialog"
      aria-modal="true"
      aria-labelledby="privacy-guard-title"
      aria-describedby="privacy-guard-description"
      onKeyDown={handleKeyDown}
    >
      <header className="genie-bubble__header">
        <span className="genie-bubble__kicker">
          {technicalError
            ? "Error local"
            : blocked
              ? `Riesgo ${score}`
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
              action="review"
              kind="primary"
              onDecision={onDecision}
            >
              Volver al mensaje
            </ActionButton>
            {originalMayBeSent ? (
              <ActionButton
                action="send-original"
                kind="quiet"
                onDecision={onDecision}
              >
                Enviar original
              </ActionButton>
            ) : null}
          </>
        ) : (
          <>
            <ActionButton
              action="redact"
              kind="primary"
              onDecision={onDecision}
            >
              {blocked ? "Eliminar y continuar" : "Anonimizar y enviar"}
            </ActionButton>
            <ActionButton
              action="review"
              kind="secondary"
              onDecision={onDecision}
            >
              {blocked ? "Volver al mensaje" : "Revisar"}
            </ActionButton>
            {blocked ? (
              <ActionButton
                action="copy-safe"
                kind="quiet"
                onDecision={onDecision}
              >
                Copiar versión segura
              </ActionButton>
            ) : (
              <>
                <ActionButton
                  action="send-original"
                  kind="quiet"
                  onDecision={onDecision}
                >
                  Enviar original
                </ActionButton>
                <ActionButton
                  action="cancel"
                  kind="quiet"
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
            action="send-original"
            kind="quiet"
            onDecision={onDecision}
          >
            Enviar original bajo mi responsabilidad
          </ActionButton>
        </details>
      ) : null}
    </div>
  );
}

interface ActionButtonProps {
  readonly action: UserDecision;
  readonly kind: "primary" | "secondary" | "quiet";
  readonly onDecision: (decision: UserDecision) => void;
  readonly children: React.ReactNode;
}

function ActionButton({
  action,
  kind,
  onDecision,
  children,
}: ActionButtonProps) {
  return (
    <button
      className={`button button--${kind}`}
      data-action={action}
      onClick={() => onDecision(action)}
    >
      {children}
    </button>
  );
}
