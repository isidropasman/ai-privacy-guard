import type { IncidentDocument } from "../../data/incidentDemo";

interface RedactionComparisonProps {
  readonly document: IncidentDocument;
}

export function RedactionComparison({ document }: RedactionComparisonProps) {
  return (
    <section
      className="incident-comparison"
      aria-labelledby="incident-comparison-title"
    >
      <div>
        <p className="eyebrow">REVISIÓN DE CAMBIOS</p>
        <h3 id="incident-comparison-title">Original → versión protegida</h3>
      </div>
      <ul>
        {document.findings.map((finding) => (
          <li key={finding.id}>
            <del>{finding.originalValue}</del>
            <span aria-hidden="true">→</span>
            <code>{finding.protectedValue}</code>
          </li>
        ))}
      </ul>
    </section>
  );
}
