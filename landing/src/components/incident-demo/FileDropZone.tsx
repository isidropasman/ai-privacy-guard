import type { IncidentDocument } from "../../data/incidentDemo";

interface FileDropZoneProps {
  readonly document: IncidentDocument;
  readonly loading: boolean;
  readonly onAnalyze: () => void;
}

export function FileDropZone({
  document,
  loading,
  onAnalyze,
}: FileDropZoneProps) {
  return (
    <section className="incident-file-drop" aria-label="Archivo para analizar">
      <span className="incident-file-icon" aria-hidden="true">
        PDF
      </span>
      <div>
        <strong>{document.name}</strong>
        <p>
          {document.pageCount} páginas · {document.size}
        </p>
      </div>
      {loading ? (
        <p role="status" aria-live="polite">
          Cargando archivo localmente…
        </p>
      ) : (
        <button type="button" className="button" onClick={onAnalyze}>
          Analizar antes de enviar
        </button>
      )}
    </section>
  );
}
