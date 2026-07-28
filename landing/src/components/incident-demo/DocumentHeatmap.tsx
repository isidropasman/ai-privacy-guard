import type {
  IncidentDocument,
  IncidentFindingSeverity,
} from "../../data/incidentDemo";

interface DocumentHeatmapProps {
  readonly document: IncidentDocument;
}

const severityRank: Readonly<Record<IncidentFindingSeverity, number>> = {
  low: 0,
  medium: 1,
  critical: 2,
};

const severityLabel: Readonly<Record<IncidentFindingSeverity, string>> = {
  low: "bajo",
  medium: "medio",
  critical: "crítico",
};

function pageSeverity(
  document: IncidentDocument,
  page: number,
): IncidentFindingSeverity {
  return document.findings
    .filter((finding) => finding.page === page)
    .reduce<IncidentFindingSeverity>(
      (highest, finding) =>
        severityRank[finding.severity] > severityRank[highest]
          ? finding.severity
          : highest,
      "low",
    );
}

export function DocumentHeatmap({ document }: DocumentHeatmapProps) {
  const pages = Array.from(
    { length: document.pageCount },
    (_, index) => index + 1,
  );

  return (
    <section className="incident-heatmap" aria-labelledby="heatmap-title">
      <div>
        <p className="eyebrow">MAPA DEL DOCUMENTO</p>
        <h3 id="heatmap-title">Riesgo por página</h3>
      </div>
      <ol aria-label="Mapa de riesgo del documento">
        {pages.map((page) => {
          const severity = pageSeverity(document, page);

          return (
            <li
              key={page}
              className={`incident-page incident-page--${severity}`}
              aria-label={`Página ${page}: riesgo ${severityLabel[severity]}`}
            >
              {page}
            </li>
          );
        })}
      </ol>
      <div className="incident-heatmap-legend" aria-label="Niveles de riesgo">
        <span>Riesgo bajo</span>
        <span>Riesgo medio</span>
        <span>Riesgo crítico</span>
      </div>
    </section>
  );
}
