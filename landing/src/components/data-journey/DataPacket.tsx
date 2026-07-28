import { motion } from "motion/react";
import type { JourneyMode, JourneyPhase } from "../../data/journeyScenarios";

interface DataPacketProps {
  readonly mode: JourneyMode;
  readonly phase: JourneyPhase;
  readonly payload: string;
  readonly reducedMotion: boolean;
}

const phasePosition: Record<JourneyPhase, string> = {
  idle: "2%",
  employee: "5%",
  boundary: "28%",
  provider: "59%",
  persistence: "78%",
  response: "94%",
  complete: "94%",
};

const protectedPhases: readonly JourneyPhase[] = [
  "boundary",
  "provider",
  "persistence",
  "response",
  "complete",
];

export function DataPacket({
  mode,
  phase,
  payload,
  reducedMotion,
}: DataPacketProps) {
  const sanitized =
    mode === "with-redacta" && protectedPhases.includes(phase);

  return (
    <motion.div
      className={`journey-packet ${sanitized ? "journey-packet--safe" : "journey-packet--risk"}`}
      style={{ left: phasePosition[phase] }}
      key={`${mode}-${phase}`}
      initial={
        reducedMotion
          ? false
          : { opacity: 0, x: "-50%", y: 8, scale: 0.94 }
      }
      animate={{ opacity: 1, x: "-50%", y: 0, scale: 1 }}
      transition={{ duration: reducedMotion ? 0 : 0.32, ease: "easeOut" }}
      aria-label={sanitized ? "Paquete anonimizado" : "Paquete con datos sensibles"}
    >
      <span aria-hidden="true">{sanitized ? "◇" : "◆"}</span>
      <code>{payload}</code>
    </motion.div>
  );
}
