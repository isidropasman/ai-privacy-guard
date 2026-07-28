interface ScanProgressProps {
  readonly currentPage: number;
  readonly pageCount: number;
}

export function ScanProgress({
  currentPage,
  pageCount,
}: ScanProgressProps) {
  const percentage = Math.round((currentPage / pageCount) * 100);

  return (
    <section className="incident-scan" aria-labelledby="incident-scan-title">
      <div>
        <p className="eyebrow">ANÁLISIS LOCAL</p>
        <h3 id="incident-scan-title">Inspeccionando el documento</h3>
      </div>
      <div
        className="incident-scan-progress"
        role="progressbar"
        aria-label="Progreso del análisis"
        aria-valuemin={0}
        aria-valuemax={pageCount}
        aria-valuenow={currentPage}
        aria-valuetext={
          currentPage === 0
            ? "Preparando escaneo"
            : `Página ${currentPage} de ${pageCount}`
        }
      >
        <span style={{ width: `${percentage}%` }} />
      </div>
      <p aria-live="polite">
        {currentPage === 0
          ? "Preparando escaneo…"
          : `Escaneando página ${currentPage} de ${pageCount}…`}
      </p>
      <small>El archivo no sale de este navegador.</small>
    </section>
  );
}
