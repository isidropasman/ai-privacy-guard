import { siteCopy } from "../../data/copy";

export function PrivacyArchitecture() {
  return (
    <section
      id="privacidad"
      className="privacy-architecture section"
      aria-labelledby="privacy-architecture-title"
    >
      <div className="privacy-architecture__heading">
        <div>
          <p className="eyebrow">{siteCopy.privacy.eyebrow}</p>
          <h2 id="privacy-architecture-title">{siteCopy.privacy.title}</h2>
        </div>
        <p>{siteCopy.privacy.body}</p>
      </div>

      <div className="privacy-architecture__diagram">
        <section
          className="privacy-architecture__local"
          aria-labelledby="local-boundary-title"
        >
          <header>
            <span>ENTORNO LOCAL</span>
            <strong id="local-boundary-title">Dentro de tu navegador</strong>
          </header>

          <ol className="privacy-architecture__pipeline">
            <li>
              <span aria-hidden="true">01</span>
              <div>
                <strong>Contenido original</strong>
                <small>Permanece local durante el análisis compatible</small>
              </div>
            </li>
            <li>
              <span aria-hidden="true">02</span>
              <div>
                <strong>Detección local</strong>
                <small>Identifica datos y secretos sensibles</small>
              </div>
            </li>
            <li>
              <span aria-hidden="true">03</span>
              <div>
                <strong>Política aplicada</strong>
                <small>Sustituye valores antes del envío</small>
              </div>
            </li>
          </ol>
        </section>

        <div className="privacy-architecture__boundary" role="note">
          <span aria-hidden="true">→</span>
          <strong>Frontera del navegador</strong>
          <small>Si Redacta interviene, cruza la versión aprobada</small>
        </div>

        <section
          className="privacy-architecture__external"
          aria-labelledby="public-server-title"
        >
          <header>
            <span>ENTORNO EXTERNO</span>
            <strong id="public-server-title">Servidor público de IA</strong>
          </header>
          <div>
            <span aria-hidden="true">◇</span>
            <p>
              <strong>Recibe el texto aprobado</strong>
              <small>
                Puede incluir sustituciones y también datos que la detección
                heurística no haya identificado.
              </small>
            </p>
          </div>
        </section>
      </div>

      <ul
        className="privacy-architecture__controls"
        aria-label="Controles de privacidad"
      >
        {siteCopy.privacy.controls.map((control, index) => (
          <li key={control.label}>
            <span aria-hidden="true">
              {String(index + 1).padStart(2, "0")}
            </span>
            <div>
              <strong>{control.label}</strong>
              <p>{control.detail}</p>
            </div>
          </li>
        ))}
      </ul>

      <p className="privacy-architecture__disclaimer" role="note">
        <strong>Alcance del control.</strong> {siteCopy.privacy.disclaimer}
      </p>
    </section>
  );
}
