import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  demoScenarios,
  type DemoScenario,
  type DemoState,
} from "../data/demoScenarios";

const SCAN_DELAY_MS = 650;
const REDACT_DELAY_MS = 450;

function highlightText(
  scenario: DemoScenario,
  state: DemoState,
): React.ReactNode {
  const showOriginal = state !== "protected" && state !== "sent";
  const text = showOriginal ? scenario.originalText : scenario.protectedText;
  if (state !== "risk-detected") return text;

  const values = scenario.findings.map((finding) => finding.originalValue);
  const pattern = new RegExp(
    `(${values.map((value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`,
    "g",
  );

  return text.split(pattern).map((part, index) =>
    values.includes(part) ? (
      <mark key={`${part}-${index}`}>{part}</mark>
    ) : (
      part
    ),
  );
}

export function InteractiveDemo() {
  const [scenarioId, setScenarioId] = useState<string>(demoScenarios[0].id);
  const [state, setState] = useState<DemoState>("idle");
  const timeoutRef = useRef<number | undefined>(undefined);
  const reduceMotion = useReducedMotion();
  const scenario = useMemo(
    () =>
      demoScenarios.find((candidate) => candidate.id === scenarioId) ??
      demoScenarios[0],
    [scenarioId],
  );
  const critical = scenario.findings.some(
    (finding) => finding.severity === "critical",
  );

  useEffect(
    () => () => {
      window.clearTimeout(timeoutRef.current);
    },
    [],
  );

  const chooseScenario = (nextId: string) => {
    window.clearTimeout(timeoutRef.current);
    setScenarioId(nextId);
    setState("idle");
  };

  const scan = () => {
    setState("scanning");
    timeoutRef.current = window.setTimeout(
      () => setState("risk-detected"),
      reduceMotion ? 0 : SCAN_DELAY_MS,
    );
  };

  const protect = () => {
    setState("redacting");
    timeoutRef.current = window.setTimeout(
      () => setState("protected"),
      reduceMotion ? 0 : REDACT_DELAY_MS,
    );
  };

  const reset = () => {
    window.clearTimeout(timeoutRef.current);
    setState("idle");
  };

  const message =
    state === "scanning"
      ? "Analizando localmente…"
      : state === "risk-detected"
        ? critical
          ? "Encontré una credencial."
          : `Encontré ${scenario.findings.length} datos sensibles.`
        : state === "protected" || state === "sent"
          ? "Listo. Solo sale la versión segura."
          : "Estoy mirando antes de que salga.";

  return (
    <div className="demo-shell" id="demo">
      <div className="demo-topline">
        <span className="window-dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span>Prompt protegido</span>
        <span className="local-badge">LOCAL</span>
      </div>

      <div className="scenario-tabs" role="tablist" aria-label="Escenario">
        {demoScenarios.map((candidate) => (
          <button
            key={candidate.id}
            type="button"
            role="tab"
            aria-selected={candidate.id === scenarioId}
            onClick={() => chooseScenario(candidate.id)}
          >
            {candidate.label}
          </button>
        ))}
      </div>

      <div className="prompt-area">
        <div className="prompt-label">
          <span>Vos</span>
          <span>{state === "sent" ? "Enviado de forma segura" : "Sin enviar"}</span>
        </div>
        <AnimatePresence mode="wait">
          <motion.pre
            key={`${scenario.id}-${state === "protected" || state === "sent"}`}
            initial={reduceMotion ? false : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
          >
            {highlightText(scenario, state)}
          </motion.pre>
        </AnimatePresence>
        <div className="prompt-actions">
          <span className="keyboard-hint">⌘ ↵</span>
          <button
            type="button"
            className="send-button"
            onClick={state === "protected" ? () => setState("sent") : scan}
            disabled={
              state === "scanning" ||
              state === "risk-detected" ||
              state === "redacting" ||
              state === "sent"
            }
          >
            {state === "protected" ? "Continuar envío" : state === "sent" ? "Enviado" : "Enviar"}
          </button>
        </div>
      </div>

      <div
        className={`guardian guardian--${state}`}
        aria-label="Guardián de seguridad de Redacta"
      >
        <div className="guardian-bubble" role="status" aria-live="polite">
          {message}
        </div>
        <img
          src="/mascot/security-genie-idle.webp"
          alt="Genio de seguridad pixel art de Redacta"
          width="128"
          height="128"
        />
      </div>

      <AnimatePresence>
        {(state === "risk-detected" || state === "redacting") && (
          <motion.aside
            className="detection-panel"
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            aria-label="Hallazgos de Redacta"
          >
            <div className="detection-heading">
              <span className={critical ? "risk-dot critical" : "risk-dot"} />
              <div>
                <strong>{critical ? "Envío bloqueado" : "Revisión necesaria"}</strong>
                <small>Analizado en este navegador</small>
              </div>
            </div>
            <ul>
              {scenario.findings.map((finding) => (
                <li key={finding.originalValue}>
                  <span>{finding.label}</span>
                  <code>{finding.replacement}</code>
                </li>
              ))}
            </ul>
            <div className="detection-actions">
              <button type="button" className="protect-button" onClick={protect}>
                {critical
                  ? "Eliminar secreto y continuar"
                  : "Anonimizar y enviar"}
              </button>
              <button type="button" className="text-button" onClick={reset}>
                {critical ? "Volver" : "Revisar"}
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {(state === "protected" || state === "sent") && (
        <div className="safe-output" role="status">
          <span aria-hidden="true">✓</span>
          <div>
            <strong>Versión segura preparada</strong>
            <small>Los datos originales no cruzan esta frontera.</small>
          </div>
        </div>
      )}
    </div>
  );
}
