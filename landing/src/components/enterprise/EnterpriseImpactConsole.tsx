const conceptualMetrics = [
  {
    value: "1.248",
    label: "Prompts inspeccionados",
    qualifier: "Volumen de ejemplo",
  },
  {
    value: "183",
    label: "Intervenciones",
    qualifier: "Resultado simulado",
  },
  {
    value: "41",
    label: "Secretos críticos bloqueados",
    qualifier: "Resultado simulado",
  },
  {
    value: "2,7 MB",
    label: "Información sensible que evitó salir",
    qualifier: "Estimación conceptual",
  },
] as const;

const conceptualDistribution = [
  {
    label: "Credenciales",
    share: 38,
  },
  {
    label: "Datos de clientes",
    share: 27,
  },
  {
    label: "Información comercial",
    share: 21,
  },
  {
    label: "Contratos",
    share: 14,
  },
] as const;

const conceptualTeamActivity = [
  {
    label: "Ingeniería",
    interventions: 74,
  },
  {
    label: "Ventas",
    interventions: 53,
  },
  {
    label: "Operaciones",
    interventions: 34,
  },
  {
    label: "Legal",
    interventions: 22,
  },
] as const;

export function EnterpriseImpactConsole() {
  return (
    <section
      id="enterprise"
      className="enterprise-impact section"
      aria-labelledby="enterprise-impact-title"
      aria-describedby="enterprise-impact-disclaimer"
    >
      <div className="enterprise-impact__heading">
        <div>
          <p className="enterprise-impact__badge">
            VISIÓN ENTERPRISE · PRÓXIMAMENTE
          </p>
          <h2 id="enterprise-impact-title">
            Convertí riesgo invisible en evidencia accionable.
          </h2>
        </div>
        <div className="enterprise-impact__intro">
          <p>
            Una vista conceptual de cómo CISO y compliance podrían priorizar
            exposición, políticas e intervención por equipo.
          </p>
          <p id="enterprise-impact-disclaimer">
            <strong>Escenario ilustrativo.</strong> No son datos reales ni
            telemetría actual. La administración y las métricas centralizadas
            forman parte de una visión futura.
          </p>
        </div>
      </div>

      <div className="enterprise-impact__console">
        <header className="enterprise-impact__window-bar">
          <div>
            <span aria-hidden="true">◆</span>
            <strong>CENTRO DE IMPACTO</strong>
          </div>
          <span>DATASET SIMULADO · VISTA CONCEPTUAL</span>
        </header>

        <div className="enterprise-impact__simulation-banner" role="note">
          <span aria-hidden="true">i</span>
          <p>
            <strong>Datos ficticios para visualizar la funcionalidad.</strong>
            Ningún valor proviene de usuarios, equipos o sistemas conectados.
          </p>
        </div>

        <ul
          className="enterprise-impact__metrics"
          aria-label="Métricas simuladas"
        >
          {conceptualMetrics.map((metric) => (
            <li key={metric.label}>
              <span>{metric.qualifier}</span>
              <strong>{metric.value}</strong>
              <p>{metric.label}</p>
              <small>Escenario simulado</small>
            </li>
          ))}
        </ul>

        <div className="enterprise-impact__grid">
          <section
            className="enterprise-impact__distribution"
            aria-labelledby="enterprise-distribution-title"
          >
            <header>
              <div>
                <span>MODELO ILUSTRATIVO</span>
                <h3 id="enterprise-distribution-title">
                  Distribución conceptual
                </h3>
              </div>
              <span>100% SIMULADO</span>
            </header>
            <ul>
              {conceptualDistribution.map((category) => (
                <li key={category.label}>
                  <div>
                    <span>{category.label}</span>
                    <strong>{category.share}%</strong>
                  </div>
                  <progress
                    max={100}
                    value={category.share}
                    aria-label={`${category.label}: ${category.share}% simulado`}
                  />
                </li>
              ))}
            </ul>
          </section>

          <section
            className="enterprise-impact__teams"
            aria-labelledby="enterprise-teams-title"
          >
            <header>
              <div>
                <span>ACTIVIDAD SIMULADA</span>
                <h3 id="enterprise-teams-title">Intervenciones por equipo</h3>
              </div>
              <span>EJEMPLO</span>
            </header>
            <ol>
              {conceptualTeamActivity.map((team, index) => (
                <li key={team.label}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <strong>{team.label}</strong>
                  <span>{team.interventions} simuladas</span>
                </li>
              ))}
            </ol>
          </section>

          <section
            className="enterprise-impact__coverage"
            aria-labelledby="enterprise-coverage-title"
          >
            <header>
              <span>COBERTURA CONCEPTUAL</span>
              <h3 id="enterprise-coverage-title">
                Proveedores contemplados
              </h3>
            </header>
            <ul>
              {["ChatGPT", "Claude", "Gemini", "Copilot"].map((provider) => (
                <li key={provider}>
                  <span aria-hidden="true">◇</span>
                  {provider}
                  <small>Conceptual</small>
                </li>
              ))}
            </ul>
          </section>

          <section
            className="enterprise-impact__policies"
            aria-labelledby="enterprise-policies-title"
          >
            <header>
              <span>CONFIGURACIÓN ILUSTRATIVA</span>
              <h3 id="enterprise-policies-title">Políticas modeladas</h3>
            </header>
            <ul>
              <li>
                <span aria-hidden="true">✓</span>
                Bloqueo de secretos
                <small>Ejemplo</small>
              </li>
              <li>
                <span aria-hidden="true">✓</span>
                Anonimización de clientes
                <small>Ejemplo</small>
              </li>
              <li>
                <span aria-hidden="true">✓</span>
                Revisión de información comercial
                <small>Ejemplo</small>
              </li>
            </ul>
          </section>
        </div>

        <footer className="enterprise-impact__footer">
          <span>PRÓXIMA FUNCIONALIDAD · SIN TELEMETRÍA ACTUAL</span>
          <span>Representación visual, no dashboard operativo</span>
        </footer>
      </div>
    </section>
  );
}
