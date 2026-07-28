import { siteCopy } from "../data/copy";

const signals = [
  "Procesamiento local",
  "Sin almacenamiento de prompts",
  "Sin entrenamiento con tus datos",
  "Permisos mínimos del navegador",
] as const;

export function PrivacySection() {
  return (
    <section className="privacy section" id="privacidad">
      <div className="privacy-copy">
        <p className="eyebrow">Privacidad por diseño</p>
        <h2>{siteCopy.privacy.title}</h2>
        <p className="privacy-lead">{siteCopy.privacy.body}</p>
        <p className="honest-note">{siteCopy.privacy.note}</p>
      </div>
      <div className="privacy-terminal" aria-label="Indicadores de privacidad">
        <div className="terminal-bar">
          <span>redacta://privacidad</span>
          <span>●</span>
        </div>
        <ul>
          {signals.map((signal, index) => (
            <li key={signal}>
              <span>0{index + 1}</span>
              <strong>{signal}</strong>
              <i aria-hidden="true">ACTIVO</i>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
