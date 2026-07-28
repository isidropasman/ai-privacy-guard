import { useEffect, useRef, useState } from "react";
import type { DecisionModalInput, UserDecision } from "../showDecisionModal";
import { GenieDecisionBubble } from "./GenieDecisionBubble";
import type { MascotState } from "./mascotState";
import { useMascotPosition } from "./useMascotPosition";

interface SecurityGenieProps {
  readonly state: MascotState;
  readonly decision: DecisionModalInput | null;
  readonly onDecision: (decision: UserDecision) => void;
  readonly onDismissStatus: () => void;
  readonly returnFocus?: HTMLElement | null;
}

function mascotAsset(): string {
  return typeof browser === "undefined"
    ? "/mascot/security-genie.webp"
    : browser.runtime.getURL("/mascot/security-genie.webp");
}

export function SecurityGenie({
  state,
  decision,
  onDecision,
  onDismissStatus,
  returnFocus,
}: SecurityGenieProps) {
  const asset = mascotAsset();
  const rootRef = useRef<HTMLElement>(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const { style, onPointerDown, consumeDrag } = useMascotPosition();
  const statusVisible =
    decision === null &&
    (state.kind === "allow" ||
      state.kind === "redacted" ||
      state.kind === "error");

  useEffect(() => {
    if (decision === null) return;
    const timeout = window.setTimeout(() => setInfoOpen(false), 0);
    return () => window.clearTimeout(timeout);
  }, [decision]);

  useEffect(() => {
    if (!infoOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setInfoOpen(false);
    };
    const closeOutside = (event: PointerEvent) => {
      const root = rootRef.current;
      if (root !== null && !event.composedPath().includes(root)) {
        setInfoOpen(false);
      }
    };

    window.addEventListener("keydown", closeOnEscape);
    window.addEventListener("pointerdown", closeOutside);
    return () => {
      window.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("pointerdown", closeOutside);
    };
  }, [infoOpen]);

  return (
    <section
      ref={rootRef}
      className="security-genie"
      style={style}
      data-mascot-state={state.kind}
      aria-label="AI Privacy Guard"
    >
      {decision === null && state.kind === "scanning" ? (
        <div className="genie-status genie-status--scanning" role="status">
          Revisando antes de enviar…
        </div>
      ) : null}

      {statusVisible ? (
        <div className="genie-status" role="status">
          <span>{state.message}</span>
          <button
            type="button"
            aria-label="Cerrar mensaje"
            onClick={onDismissStatus}
          >
            ×
          </button>
        </div>
      ) : null}

      {decision === null ? null : (
        <GenieDecisionBubble
          {...decision}
          onDecision={onDecision}
          returnFocus={returnFocus}
        />
      )}

      {infoOpen && decision === null ? (
        <aside
          className="genie-bubble genie-info"
          role="dialog"
          aria-labelledby="security-genie-info-title"
          data-surface="genie-info"
        >
          <span className="genie-bubble__kicker">Security Genie</span>
          <h2 id="security-genie-info-title">¿Por qué estoy acá?</h2>
          <p>
            Reviso tus mensajes localmente antes de que salgan de ChatGPT.
          </p>
          <ul>
            <li>Analizo localmente</li>
            <li>Bloqueo secretos y credenciales</li>
            <li>Anonimizo datos personales</li>
          </ul>
          <button
            className="button button--primary"
            type="button"
            onClick={() => setInfoOpen(false)}
          >
            Entendido
          </button>
        </aside>
      ) : null}

      <img
        className="security-genie__preload"
        src={asset}
        alt=""
        aria-hidden="true"
        data-mascot-preload
      />
      <button
        className="security-genie__trigger"
        type="button"
        {...(decision === null
          ? {
              "aria-label": "¿Qué hace Security Genie?",
              "aria-expanded": infoOpen,
            }
          : { "aria-hidden": true, tabIndex: -1 })}
        onPointerDown={onPointerDown}
        onClick={() => {
          if (consumeDrag() || decision !== null) return;
          setInfoOpen((open) => !open);
        }}
        data-mascot-trigger
      >
        <span className="security-genie__hover-layer">
          <span
            className={`security-genie__sprite security-genie__sprite--${state.kind}`}
            style={{ backgroundImage: `url("${asset}")` }}
            role="img"
            aria-label="Security Genie"
            data-mascot-sprite
          />
          <span className="security-genie__particle" aria-hidden="true" />
          <span className="security-genie__particle" aria-hidden="true" />
          <span className="security-genie__particle" aria-hidden="true" />
        </span>
      </button>
    </section>
  );
}
