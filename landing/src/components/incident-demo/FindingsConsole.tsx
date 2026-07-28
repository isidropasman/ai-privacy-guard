import type {
  IncidentDocument,
  IncidentFinding,
  IncidentFindingSeverity,
} from "../../data/incidentDemo";

interface FindingsConsoleProps {
  readonly document: IncidentDocument;
}

const categoryLabel: Readonly<
  Record<IncidentFinding["category"], string>
> = {
  client: "Cliente",
  email: "Email",
  price: "Precio",
  margin: "Margen",
  "commercial-strategy": "Estrategia comercial",
  "api-key": "Clave API",
};

const severityLabel: Readonly<Record<IncidentFindingSeverity, string>> = {
  low: "Bajo",
  medium: "Medio",
  critical: "Crítico",
};

export function FindingsConsole({ document }: FindingsConsoleProps) {
  return (
    <section
      className="incident-findings"
      aria-labelledby="incident-findings-title"
    >
      <div>
        <p className="eyebrow">CONSOLA DE HALLAZGOS</p>
        <h3 id="incident-findings-title">
          {document.findings.length} hallazgos detectados
        </h3>
        <p>{document.criticalFindings} requieren bloqueo inmediato.</p>
      </div>
      <ul>
        {document.findings.map((finding) => (
          <li key={finding.id}>
            <span
              className={`incident-severity incident-severity--${finding.severity}`}
            >
              {severityLabel[finding.severity]}
            </span>
            <strong>{categoryLabel[finding.category]}</strong>
            <span>Página {finding.page}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
