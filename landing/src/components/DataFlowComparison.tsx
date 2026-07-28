import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { siteCopy } from "../data/copy";

const rawTokens = ["ACME", "47%", "sk-proj…", "juan@…"];
const safeTokens = [
  "[CLIENT_NAME]",
  "[MARGIN]",
  "[API_KEY_REMOVED]",
  "[EMAIL_CONTACT]",
];

export function DataFlowComparison() {
  const [protectedFlow, setProtectedFlow] = useState(true);
  const reduceMotion = useReducedMotion();
  const steps = protectedFlow
    ? ["Empleado", "Análisis local", "Anonimización", "IA pública"]
    : ["Empleado", "Prompt sensible", "IA pública", "Servidor externo"];
  const labels = protectedFlow
    ? ["Se detecta localmente.", "Se protege en un clic.", "Solo sale contenido seguro."]
    : ["El contenido sale completo.", "Se pierde control sobre el dato.", "Queda sujeto a políticas externas."];

  return (
    <section className="flow section" id="como-funciona">
      <div className="section-heading-wide">
        <div>
          <p className="eyebrow">La frontera de salida</p>
          <h2>{siteCopy.flow.title}</h2>
        </div>
        <p>{siteCopy.flow.body}</p>
      </div>
      <div className="flow-stage">
        <div className="segmented" aria-label="Comparar flujo">
          <button
            type="button"
            aria-pressed={!protectedFlow}
            onClick={() => setProtectedFlow(false)}
          >
            Sin Redacta
          </button>
          <button
            type="button"
            aria-pressed={protectedFlow}
            onClick={() => setProtectedFlow(true)}
          >
            Con Redacta
          </button>
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            className={`flow-visual ${protectedFlow ? "is-protected" : "is-exposed"}`}
            key={String(protectedFlow)}
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
          >
            <div className="flow-nodes">
              {steps.map((step, index) => (
                <div className="flow-step" key={step}>
                  <span>{index + 1}</span>
                  <strong>{step}</strong>
                  {index < steps.length - 1 && <i aria-hidden="true">→</i>}
                </div>
              ))}
            </div>
            <div className="token-track" aria-label="Transformación de datos">
              {rawTokens.map((token, index) => (
                <div className="data-token" key={token}>
                  <code>{token}</code>
                  {protectedFlow && (
                    <>
                      <span aria-hidden="true">→</span>
                      <code className="safe-token">{safeTokens[index]}</code>
                    </>
                  )}
                </div>
              ))}
            </div>
            <ul className="flow-labels">
              {labels.map((label) => (
                <li key={label}>
                  <span aria-hidden="true">{protectedFlow ? "✓" : "!"}</span>
                  {label}
                </li>
              ))}
            </ul>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
