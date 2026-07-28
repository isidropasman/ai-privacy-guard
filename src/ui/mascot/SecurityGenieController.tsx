import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useReducer,
  useRef,
  useState,
} from "react";
import type { DecisionModalInput, UserDecision } from "../showDecisionModal";
import { SecurityGenie } from "./SecurityGenie";
import { reduceMascotState, type MascotEvent } from "./mascotState";

export interface SecurityGenieHandle {
  readonly emit: (event: MascotEvent) => void;
  readonly requestDecision: (
    input: DecisionModalInput,
  ) => Promise<UserDecision>;
}

interface PendingDecision {
  readonly promise: Promise<UserDecision>;
  readonly resolve: (decision: UserDecision) => void;
}

export const SecurityGenieController = forwardRef<SecurityGenieHandle>(
  function SecurityGenieController(_props, ref) {
    const [state, dispatch] = useReducer(reduceMascotState, { kind: "idle" });
    const [decision, setDecision] = useState<DecisionModalInput | null>(null);
    const [returnFocus, setReturnFocus] = useState<HTMLElement | null>(null);
    const pendingDecisionRef = useRef<PendingDecision | null>(null);

    useEffect(() => {
      if (state.kind !== "allow" && state.kind !== "redacted") return;
      const timeout = window.setTimeout(
        () => dispatch({ kind: "reset" }),
        3200,
      );
      return () => window.clearTimeout(timeout);
    }, [state.kind]);

    useImperativeHandle(
      ref,
      () => ({
        emit: dispatch,
        requestDecision(input) {
          if (pendingDecisionRef.current !== null) {
            return pendingDecisionRef.current.promise;
          }

          const focusTarget =
            document.activeElement instanceof HTMLElement
              ? document.activeElement
              : null;
          let resolveDecision: ((decision: UserDecision) => void) | undefined;
          const promise = new Promise<UserDecision>((resolve) => {
            resolveDecision = resolve;
          });
          pendingDecisionRef.current = {
            promise,
            resolve(decisionResult) {
              pendingDecisionRef.current = null;
              setDecision(null);
              setReturnFocus(null);
              queueMicrotask(() => focusTarget?.focus());
              resolveDecision?.(decisionResult);
            },
          };

          setReturnFocus(focusTarget);
          setDecision(input);
          dispatch(
            input.technicalError
              ? { kind: "failed" }
              : input.decision === "BLOCK"
                ? { kind: "blocked" }
                : { kind: "verification-requested" },
          );
          return promise;
        },
      }),
      [],
    );

    const handleDecision = (result: UserDecision) => {
      pendingDecisionRef.current?.resolve(result);
    };

    return (
      <SecurityGenie
        state={state}
        decision={decision}
        onDecision={handleDecision}
        onDismissStatus={() => dispatch({ kind: "reset" })}
        returnFocus={returnFocus}
      />
    );
  },
);
