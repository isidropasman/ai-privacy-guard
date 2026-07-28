import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import {
  journeyScenarios,
  type JourneyMode,
  type JourneyPhase,
} from "../../data/journeyScenarios";
import { DataPacket } from "./DataPacket";
import "./DataJourneySimulator.css";
import { JourneyNode } from "./JourneyNode";

const phaseOrder: readonly JourneyPhase[] = [
  "idle",
  "employee",
  "boundary",
  "provider",
  "persistence",
  "response",
  "complete",
];

const phaseRank = new Map(
  phaseOrder.map((phase, index) => [phase, index] as const),
);

function hasReached(current: JourneyPhase, target: JourneyPhase) {
  return (phaseRank.get(current) ?? 0) > (phaseRank.get(target) ?? 0);
}

export function DataJourneySimulator() {
  const [mode, setMode] = useState<JourneyMode>("with-redacta");
  const [phase, setPhase] = useState<JourneyPhase>("idle");
  const reduceMotion = useReducedMotion() ?? false;
  const scenario = journeyScenarios[mode];
  const isProtected = mode === "with-redacta";
  const outboundPayload =
    isProtected && hasReached(phase, "employee")
      ? scenario.outboundPayload
      : scenario.input;

  const selectMode = (nextMode: JourneyMode) => {
    setMode(nextMode);
    setPhase("idle");
  };

  const advance = () => {
    const currentIndex = phaseRank.get(phase) ?? 0;
    setPhase(phaseOrder[Math.min(currentIndex + 1, phaseOrder.length - 1)]);
  };

  const buttonLabel =
    phase === "idle"
      ? "Iniciar recorrido"
      : phase === "complete"
        ? "Recorrido completo"
        : "Avanzar recorrido";

  return (
    <section className="journey-simulator" aria-labelledby="journey-title">
      <div className="journey-heading">
        <div>
          <p className="eyebrow">Trazabilidad del dato</p>
          <h2 id="journey-title">Seguí el dato hasta donde queda guardado.</h2>
        </div>
        <p>
          Avanzá manualmente por cada frontera. El cambio importante ocurre
          antes de que el prompt salga del navegador.
        </p>
      </div>

      <div className="journey-console">
        <div className="journey-toolbar">
          <div
            className="journey-mode"
            role="group"
            aria-label="Modo del recorrido"
          >
            {(["without-redacta", "with-redacta"] as const).map(
              (candidate) => (
                <button
                  type="button"
                  key={candidate}
                  aria-pressed={mode === candidate}
                  onClick={() => selectMode(candidate)}
                >
                  {journeyScenarios[candidate].label}
                </button>
              ),
            )}
          </div>
          <span
            className={`journey-boundary-label ${isProtected ? "is-safe" : "is-risk"}`}
          >
            {isProtected ? "Frontera protegida" : "Frontera abierta"}
          </span>
        </div>

        <div className="journey-input">
          <span>Prompt original · permanece visible solo en este navegador</span>
          <code>{scenario.input}</code>
        </div>

        <div className="journey-map" aria-label="Recorrido del dato">
          <div className="journey-map__canvas">
            <div className="journey-map__labels" aria-hidden="true">
              <span>ENTORNO LOCAL</span>
              <span>TERCERO EXTERNO</span>
            </div>
            <div className="journey-track" aria-hidden="true">
              <span />
            </div>

            {phase !== "idle" && (
              <DataPacket
                mode={mode}
                phase={phase}
                payload={outboundPayload}
                reducedMotion={reduceMotion}
              />
            )}

            <ol className="journey-nodes">
              <JourneyNode
                label="Empleado"
                detail="Escribe el prompt"
                icon="⌨"
                active={phase === "employee"}
                current={phase === "employee"}
                visited={hasReached(phase, "employee")}
              />
              <JourneyNode
                label="Navegador"
                detail="Frontera de salida"
                icon="▣"
                active={phase === "boundary"}
                current={!isProtected && phase === "boundary"}
                visited={hasReached(phase, "boundary")}
              />
              <JourneyNode
                label="Redacta"
                detail={isProtected ? "Sanitiza localmente" : "No interviene"}
                icon="◈"
                active={isProtected && phase === "boundary"}
                current={isProtected && phase === "boundary"}
                visited={isProtected && hasReached(phase, "boundary")}
                disabled={!isProtected}
                tone="safe"
              />
              <JourneyNode
                label="Proveedor IA"
                detail={
                  isProtected ? "Recibe etiquetas" : "Recibe el original"
                }
                icon="◎"
                active={phase === "provider"}
                current={phase === "provider"}
                visited={hasReached(phase, "provider")}
                tone={isProtected ? "neutral" : "risk"}
              />
              <JourneyNode
                label="Storage"
                detail={isProtected ? "Copia anonimizada" : "Copia sensible"}
                icon="▤"
                active={phase === "persistence"}
                current={phase === "persistence"}
                visited={hasReached(phase, "persistence")}
                tone={isProtected ? "neutral" : "risk"}
              />
              <JourneyNode
                label="Respuesta"
                detail={
                  isProtected ? "Sin identidad expuesta" : "Dato ya expuesto"
                }
                icon="↩"
                active={phase === "response" || phase === "complete"}
                current={phase === "response" || phase === "complete"}
                visited={phase === "complete"}
                tone={isProtected ? "safe" : "risk"}
              />
            </ol>
          </div>
        </div>

        <motion.div
          className={`journey-event ${isProtected ? "journey-event--safe" : "journey-event--risk"}`}
          key={`${mode}-${phase}`}
          initial={reduceMotion ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.2 }}
        >
          <span className="journey-event__step">
            {String(phaseRank.get(phase) ?? 0).padStart(2, "0")} / 06
          </span>
          <p role="status" aria-live="polite">
            {scenario.phaseMessages[phase]}
          </p>
        </motion.div>

        {isProtected && hasReached(phase, "employee") && (
          <div
            className="journey-outcome journey-outcome--safe"
            role="group"
            aria-label="Payload saliente anonimizado"
          >
            <span>Sanitizado localmente</span>
            <code>{scenario.outboundPayload}</code>
          </div>
        )}

        {!isProtected && hasReached(phase, "provider") && (
          <div className="journey-outcome journey-outcome--risk">
            <span>Persistencia externa: contenido original</span>
            <code>{scenario.storagePayload}</code>
          </div>
        )}

        <div className="journey-controls">
          <button
            type="button"
            className="journey-reset"
            onClick={() => setPhase("idle")}
            disabled={phase === "idle"}
          >
            Reiniciar
          </button>
          <button
            type="button"
            className="journey-advance"
            onClick={advance}
            disabled={phase === "complete"}
          >
            {buttonLabel}
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </section>
  );
}
