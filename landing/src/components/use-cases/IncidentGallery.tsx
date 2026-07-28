import { useState, type KeyboardEvent } from "react";
import {
  useCases,
  type IncidentStateId,
} from "../../data/useCases";
import { IncidentScene } from "./IncidentScene";

const stateOptions = [
  {
    id: "original",
    label: "Original",
  },
  {
    id: "findings",
    label: "Hallazgos",
  },
  {
    id: "protected",
    label: "Versión protegida",
  },
] as const satisfies readonly {
  readonly id: IncidentStateId;
  readonly label: string;
}[];

export function IncidentGallery() {
  const [selectedCaseIndex, setSelectedCaseIndex] = useState(0);
  const [state, setState] = useState<IncidentStateId>("original");
  const selectedCase = useCases[selectedCaseIndex];

  const selectCase = (index: number) => {
    setSelectedCaseIndex(index);
    setState("original");
  };

  const handleCaseKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    currentIndex: number,
  ) => {
    let nextIndex: number | undefined;

    if (event.key === "ArrowDown" || event.key === "ArrowRight") {
      nextIndex = (currentIndex + 1) % useCases.length;
    }

    if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
      nextIndex = (currentIndex - 1 + useCases.length) % useCases.length;
    }

    if (event.key === "Home") {
      nextIndex = 0;
    }

    if (event.key === "End") {
      nextIndex = useCases.length - 1;
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
          Explorá escenas ficticias y locales. Cada recorrido muestra el
          original, los hallazgos y la versión que podría enviarse protegida.
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
            {useCases.map((useCase, index) => {
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

          <div className="incident-gallery__scope">
            <span aria-hidden="true">◇</span>
            <p>
              <strong>Simulación en este navegador</strong>
              No procesa archivos ni envía contenido.
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
            <div
              className="incident-gallery__state-selector"
              role="group"
              aria-label="Vista del documento"
            >
              {stateOptions.map((option, index) => (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={state === option.id}
                  onClick={() => setState(option.id)}
                >
                  <span aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div aria-live="polite">
            <IncidentScene incident={selectedCase} state={state} />
          </div>
        </div>
      </div>
    </section>
  );
}
