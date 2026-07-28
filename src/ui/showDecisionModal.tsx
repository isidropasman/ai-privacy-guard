import type { DetectionFinding } from "../detection/types";
import type { PolicyDecision } from "../policy/PolicyEngine";
import { createRoot } from "react-dom/client";
import { WarningModal } from "./WarningModal";

export type UserDecision =
  "redact" | "review" | "send-original" | "cancel" | "copy-safe";

export interface DecisionModalInput {
  readonly decision: Exclude<PolicyDecision, "ALLOW">;
  readonly score: number;
  readonly findings: readonly DetectionFinding[];
  readonly redactedText: string;
  readonly allowCriticalOverride?: boolean;
  readonly technicalError?: boolean;
  readonly originalMayBeSent?: boolean;
}

export function showDecisionModal(
  shadow: ShadowRoot,
  input: DecisionModalInput,
): Promise<UserDecision> {
  const existing = shadow.querySelector("[data-privacy-guard-modal]");
  existing?.remove();
  const container = document.createElement("div");
  container.dataset.privacyGuardModal = "true";
  shadow.append(container);
  const root = createRoot(container);

  return new Promise((resolve) => {
    let resolved = false;
    const finish = (decision: UserDecision) => {
      if (resolved) return;
      resolved = true;
      queueMicrotask(() => {
        root.unmount();
        container.remove();
      });
      resolve(decision);
    };

    root.render(<WarningModal {...input} onDecision={finish} />);
  });
}
