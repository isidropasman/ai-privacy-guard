import { showDecisionModal, type UserDecision } from "./showDecisionModal";

export function showTechnicalErrorModal(
  shadow: ShadowRoot,
  originalMayBeSent: boolean,
): Promise<UserDecision> {
  return showDecisionModal(shadow, {
    decision: "WARN",
    score: 0,
    findings: [],
    redactedText: "",
    technicalError: true,
    originalMayBeSent,
  });
}
