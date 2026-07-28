import { useId, useState, type DragEvent } from "react";
import { buildUploadedIncident } from "../../data/uploadedIncident";
import type { IncidentUseCase } from "../../data/useCases";

// ponytail: solo texto plano; un parser de PDF/DOCX es otra feature
const MAX_BYTES = 512 * 1024;

interface FileDropZoneProps {
  readonly onLoaded: (incident: IncidentUseCase) => void;
}

export function FileDropZone({ onLoaded }: FileDropZoneProps) {
  const inputId = useId();
  const [error, setError] = useState<string | undefined>(undefined);
  const [dragging, setDragging] = useState(false);

  const load = async (file: File | undefined) => {
    if (!file) return;

    if (file.size > MAX_BYTES) {
      setError("El archivo supera 512 KB.");
      return;
    }

    const text = await file.text();

    if (text.trim().length === 0) {
      setError("El archivo no tiene texto legible.");
      return;
    }

    setError(undefined);
    onLoaded(buildUploadedIncident(file.name, text));
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    void load(event.dataTransfer.files[0]);
  };

  return (
    <div
      className="incident-gallery__drop"
      data-dragging={dragging}
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      <label htmlFor={inputId}>
        <strong>Cargar tu propio archivo</strong>
        Arrastrá un .txt, .md, .json o código y Rick lo revisa acá mismo.
      </label>
      <input
        id={inputId}
        type="file"
        accept=".txt,.md,.json,.csv,.log,.env,.ts,.js,.py,.sql,text/*"
        onChange={(event) => void load(event.target.files?.[0])}
      />
      {error !== undefined && <p role="alert">{error}</p>}
    </div>
  );
}
