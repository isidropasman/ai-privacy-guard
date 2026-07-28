import type {
  IncidentFinding,
  IncidentStateId,
  IncidentUseCase,
} from "../../data/useCases";

interface IncidentSceneProps {
  readonly incident: IncidentUseCase;
  readonly state: IncidentStateId;
}

const severityLabel: Readonly<Record<IncidentFinding["severity"], string>> = {
  medium: "Medio",
  critical: "Crítico",
};

export function IncidentScene({ incident, state }: IncidentSceneProps) {
  const activeState = incident.states[state];
  const findingLabelById = new Map(
    incident.findings.map((finding) => [finding.id, finding.label] as const),
  );

  return (
    <article
      className={`incident-scene incident-scene--${state}`}
      data-incident={incident.id}
      data-state={state}
    >
      <header className="incident-scene__window-bar">
        <span aria-hidden="true" className="incident-scene__glyph">
          {incident.glyph}
        </span>
        <div>
          <strong>{incident.fileName}</strong>
          <span>{incident.context}</span>
        </div>
        <span className="incident-scene__local-badge">EJEMPLO LOCAL</span>
      </header>

      <div className="incident-scene__stage">
        <div className="incident-scene__stage-heading">
          <span>{activeState.label}</span>
          <span role="status">{activeState.status}</span>
        </div>

        <pre
          className="incident-scene__document"
          aria-label={`${activeState.label}: ${activeState.status}`}
        >
          {activeState.segments.map((segment, index) => {
            const key = `${state}-${index}`;

            if (segment.tone === "sensitive") {
              return (
                <mark
                  key={key}
                  className="incident-scene__sensitive"
                  aria-label={
                    segment.findingId === undefined
                      ? "Dato sensible"
                      : findingLabelById.get(segment.findingId)
                  }
                >
                  {segment.text}
                </mark>
              );
            }

            if (segment.tone === "replacement") {
              return (
                <span
                  key={key}
                  className="incident-scene__replacement"
                  aria-label={
                    segment.findingId === undefined
                      ? "Reemplazo protegido"
                      : `${findingLabelById.get(segment.findingId) ?? "Dato sensible"} reemplazado`
                  }
                >
                  {segment.text}
                </span>
              );
            }

            return <span key={key}>{segment.text}</span>;
          })}
        </pre>
      </div>

      {state === "findings" && (
        <ol className="incident-scene__findings" aria-label="Hallazgos">
          {incident.findings.map((finding, index) => (
            <li key={finding.id}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{finding.label}</strong>
              <span
                className={`incident-scene__severity incident-scene__severity--${finding.severity}`}
              >
                {severityLabel[finding.severity]}
              </span>
            </li>
          ))}
        </ol>
      )}

      {state === "protected" && (
        <div className="incident-scene__receipt">
          <span aria-hidden="true">✓</span>
          <p>
            <strong>Versión segura preparada.</strong>
            Los valores del ejemplo fueron sustituidos antes de salir del
            navegador.
          </p>
        </div>
      )}

      <footer className="incident-scene__footer">
        <span>Escena ficticia</span>
        <span>Sin upload · sin llamadas externas</span>
      </footer>
    </article>
  );
}
