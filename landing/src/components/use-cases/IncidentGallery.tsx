import { useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import {
  useCases,
  type IncidentStateId,
  type IncidentUseCase,
} from "../../data/useCases";
import { FileDropZone } from "./FileDropZone";
import { IncidentScene } from "./IncidentScene";

type FlowState =
  | "idle"
  | "scanning"
  | "risk-detected"
  | "redacting"
  | "protected"
  | "sent";

const SCAN_DELAY_MS = 700;
const REDACT_DELAY_MS = 500;

const sceneStateByFlow: Readonly<Record<FlowState, IncidentStateId>> = {
  idle: "original",
  scanning: "original",
  "risk-detected": "findings",
  redacting: "findings",
  protected: "protected",
  sent: "protected",
};

function guardianMessage(flow: FlowState, incident: IncidentUseCase): string {
  const critical = incident.findings.filter(
    (finding) => finding.severity === "critical",
  ).length;

  switch (flow) {
    case "idle":
      return "Esto está por salir tal cual. ¿Lo enviamos?";
    case "scanning":
      return "Esperá, lo estoy revisando acá mismo…";
    case "risk-detected":
      return critical > 0
        ? `Frená. Encontré ${incident.findings.length} datos sensibles, ${critical} de ellos crítico${critical === 1 ? "" : "s"}.`
        : `Encontré ${incident.findings.length} datos sensibles antes de que salgan.`;
    case "redacting":
      return "Reemplazando los valores…";
    case "protected":
      return "Ya está limpio. Ahora sí podés enviarlo.";
    case "sent":
      return "Enviado. Los valores originales nunca salieron de tu navegador.";
  }
}

export function IncidentGallery() {
  const [selectedCaseIndex, setSelectedCaseIndex] = useState(0);
  const [flow, setFlow] = useState<FlowState>("idle");
  const [uploaded, setUploaded] = useState<IncidentUseCase | undefined>(
    undefined,
  );
  const timeoutRef = useRef<number | undefined>(undefined);
  const reduceMotion = useReducedMotion();
  const cases = uploaded === undefined ? useCases : [...useCases, uploaded];
  const selectedCase = cases[selectedCaseIndex] ?? cases[0];
  const critical = selectedCase.findings.some(
    (finding) => finding.severity === "critical",
  );

  useEffect(
    () => () => {
      window.clearTimeout(timeoutRef.current);
    },
    [],
  );

  const selectCase = (index: number) => {
    window.clearTimeout(timeoutRef.current);
    setSelectedCaseIndex(index);
    setFlow("idle");
  };

  const scan = () => {
    setFlow("scanning");
    timeoutRef.current = window.setTimeout(
      () => setFlow("risk-detected"),
      reduceMotion ? 0 : SCAN_DELAY_MS,
    );
  };

  const anonymize = () => {
    setFlow("redacting");
    timeoutRef.current = window.setTimeout(
      () => setFlow("protected"),
      reduceMotion ? 0 : REDACT_DELAY_MS,
    );
  };

  const reset = () => {
    window.clearTimeout(timeoutRef.current);
    setFlow("idle");
  };

  const handleCaseKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    currentIndex: number,
  ) => {
    let nextIndex: number | undefined;

    if (event.key === "ArrowDown" || event.key === "ArrowRight") {
      nextIndex = (currentIndex + 1) % cases.length;
    }

    if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
      nextIndex = (currentIndex - 1 + cases.length) % cases.length;
    }

    if (event.key === "Home") {
      nextIndex = 0;
    }

    if (event.key === "End") {
      nextIndex = cases.length - 1;
    }

    if (nextIndex === undefined) {
      return;
    }

    event.preventDefault();
    selectCase(nextIndex);
    document.getElementById(`incident-case-tab-${nextIndex}`)?.focus();
  };

  return (
    <section
      id="casos"
      className="incident-gallery section"
      aria-labelledby="incident-gallery-title"
    >
      <div className="incident-gallery__heading">
        <div>
          <p className="eyebrow">GALERÍA DE INCIDENTES</p>
          <h2 id="incident-gallery-title">
            El mismo control, frente a cuatro fugas distintas.
          </h2>
        </div>
        <p>
          Elegí una escena ficticia y mandala como la mandarías de verdad.
          Redacta la revisa en este navegador antes de que salga.
        </p>
      </div>

      <div className="incident-gallery__console">
        <aside className="incident-gallery__sidebar">
          <p>TIPO DE INCIDENTE</p>
          <div
            className="incident-gallery__case-selector"
            role="tablist"
            aria-label="Casos de uso"
            aria-orientation="vertical"
          >
            {cases.map((useCase, index) => {
              const isSelected = index === selectedCaseIndex;

              return (
                <button
                  key={useCase.id}
                  id={`incident-case-tab-${index}`}
                  type="button"
                  role="tab"
                  tabIndex={isSelected ? 0 : -1}
                  aria-label={useCase.label}
                  aria-selected={isSelected}
                  aria-controls="incident-gallery-panel"
                  onClick={() => selectCase(index)}
                  onKeyDown={(event) => handleCaseKeyDown(event, index)}
                >
                  <span aria-hidden="true">{useCase.glyph}</span>
                  <span>
                    <strong>{useCase.label}</strong>
                    <small>{useCase.context}</small>
                  </span>
                </button>
              );
            })}
          </div>

          <FileDropZone
            onLoaded={(incident) => {
              window.clearTimeout(timeoutRef.current);
              setUploaded(incident);
              setSelectedCaseIndex(useCases.length);
              setFlow("idle");
            }}
          />

          <div className="incident-gallery__scope">
            <span aria-hidden="true">◇</span>
            <p>
              <strong>Todo corre en este navegador</strong>
              El archivo se lee en memoria: no se sube ni sale de tu equipo.
            </p>
          </div>
        </aside>

        <div
          id="incident-gallery-panel"
          className="incident-gallery__workspace"
          role="tabpanel"
          aria-labelledby={`incident-case-tab-${selectedCaseIndex}`}
          aria-label={selectedCase.label}
        >
          <div className="incident-gallery__toolbar">
            <div>
              <span>ESCENA ACTIVA</span>
              <strong>{selectedCase.label}</strong>
            </div>
          </div>

          <div aria-live="polite">
            <IncidentScene
              incident={selectedCase}
              state={sceneStateByFlow[flow]}
            />
          </div>

          <div className={`incident-gallery__guardian is-${flow}`}>
            <img
              src="/mascot/rick-idle.webp"
              alt="Rick, el guardián de Redacta"
              width="64"
              height="64"
            />
            <p className="incident-gallery__bubble" role="status">
              {guardianMessage(flow, selectedCase)}
            </p>
          </div>

          <div className="incident-gallery__actions">
            {flow === "idle" && (
              <button type="button" className="button" onClick={scan}>
                Enviar
              </button>
            )}

            {flow === "scanning" && (
              <button type="button" className="button" disabled>
                Analizando…
              </button>
            )}

            {flow === "risk-detected" && (
              <>
                <button type="button" className="button" onClick={anonymize}>
                  {critical
                    ? "Eliminar secretos y continuar"
                    : "Anonimizar y enviar"}
                </button>
                <button
                  type="button"
                  className="button button-ghost"
                  onClick={reset}
                >
                  Volver
                </button>
              </>
            )}

            {flow === "redacting" && (
              <button type="button" className="button" disabled>
                Anonimizando…
              </button>
            )}

            {flow === "protected" && (
              <button
                type="button"
                className="button"
                onClick={() => setFlow("sent")}
              >
                Continuar envío
              </button>
            )}

            {flow === "sent" && (
              <button
                type="button"
                className="button button-ghost"
                onClick={reset}
              >
                Probar de nuevo
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
