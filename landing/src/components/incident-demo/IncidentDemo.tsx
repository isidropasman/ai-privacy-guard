import { useReducedMotion } from "motion/react";
import { useEffect, useReducer, useState } from "react";
import { incidentDocument } from "../../data/incidentDemo";
import { DocumentHeatmap } from "./DocumentHeatmap";
import { FileDropZone } from "./FileDropZone";
import { FindingsConsole } from "./FindingsConsole";
import {
  transitionIncident,
} from "./incidentDemoMachine";
import { ProtectionReceipt } from "./ProtectionReceipt";
import { RedactionComparison } from "./RedactionComparison";
import { ScanProgress } from "./ScanProgress";

const FILE_LOAD_DELAY_MS = 450;
const PAGE_SCAN_DELAY_MS = 50;
const REDACTION_DELAY_MS = 650;

export function IncidentDemo() {
  const [state, dispatch] = useReducer(transitionIncident, "ready");
  const [scannedPage, setScannedPage] = useState(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (state === "loading-file") {
      const timeoutId = window.setTimeout(
        () => dispatch({ type: "FILE_LOADED" }),
        reduceMotion ? 0 : FILE_LOAD_DELAY_MS,
      );

      return () => window.clearTimeout(timeoutId);
    }

    if (state === "scanning") {
      setScannedPage(0);

      if (reduceMotion) {
        const timeoutId = window.setTimeout(() => {
          setScannedPage(incidentDocument.pageCount);
          dispatch({ type: "SCAN_COMPLETED" });
        }, 0);

        return () => window.clearTimeout(timeoutId);
      }

      let page = 0;
      const intervalId = window.setInterval(() => {
        page += 1;
        setScannedPage(page);

        if (page === incidentDocument.pageCount) {
          window.clearInterval(intervalId);
          dispatch({ type: "SCAN_COMPLETED" });
        }
      }, PAGE_SCAN_DELAY_MS);

      return () => window.clearInterval(intervalId);
    }

    if (state === "redacting") {
      const timeoutId = window.setTimeout(
        () => dispatch({ type: "REDACTION_COMPLETED" }),
        reduceMotion ? 0 : REDACTION_DELAY_MS,
      );

      return () => window.clearTimeout(timeoutId);
    }

    return undefined;
  }, [reduceMotion, state]);

  return (
    <div className={`incident-demo incident-demo--${state}`}>
      <header className="incident-demo-header">
        <div>
          <span className="window-dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span>Simulador de incidente</span>
        </div>
        <span className="local-badge">100% LOCAL</span>
      </header>

      {(state === "ready" || state === "loading-file") && (
        <FileDropZone
          document={incidentDocument}
          loading={state === "loading-file"}
          onAnalyze={() => dispatch({ type: "START" })}
        />
      )}

      {state === "scanning" && (
        <ScanProgress
          currentPage={scannedPage}
          pageCount={incidentDocument.pageCount}
        />
      )}

      {state === "findings" && (
        <>
          <DocumentHeatmap document={incidentDocument} />
          <FindingsConsole document={incidentDocument} />
          <button
            type="button"
            className="button"
            onClick={() => dispatch({ type: "REDACT" })}
          >
            Generar versión segura
          </button>
        </>
      )}

      {state === "redacting" && (
        <p role="status" aria-live="polite">
          Protegiendo {incidentDocument.findings.length} hallazgos…
        </p>
      )}

      {state === "review" && (
        <>
          <RedactionComparison document={incidentDocument} />
          <button
            type="button"
            className="button"
            onClick={() => dispatch({ type: "APPROVE" })}
          >
            Aprobar cambios
          </button>
        </>
      )}

      {(state === "safe-to-send" || state === "sent") && (
        <>
          <ProtectionReceipt
            document={incidentDocument}
            sent={state === "sent"}
          />
          {state === "safe-to-send" && (
            <button
              type="button"
              className="button"
              onClick={() => dispatch({ type: "SEND" })}
            >
              Enviar versión segura
            </button>
          )}
        </>
      )}
    </div>
  );
}
