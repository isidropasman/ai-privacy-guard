import { siteCopy } from "../data/copy";
import { accessChannel } from "../data/accessChannel";

export function FinalCTA() {
  return (
    <section
      id="acceso"
      className="final-cta section"
      aria-labelledby="cta-title"
    >
      <div className="cta-mascot">
        <img
          src="/mascot/security-genie-shield.webp"
          alt=""
          width="160"
          height="160"
          loading="lazy"
        />
      </div>
      <div>
        <p className="eyebrow">{siteCopy.cta.eyebrow}</p>
        <h2 id="cta-title">{siteCopy.cta.title}</h2>
        <p>{siteCopy.cta.body}</p>
        <div className="cta-actions">
          {accessChannel.status === "available" ? (
            <a className="button" href={accessChannel.href}>
              Solicitar acceso
            </a>
          ) : (
            <button className="button" type="button" disabled>
              Canal de acceso en preparación
            </button>
          )}
          <a className="button button-ghost" href="#demo">
            Repetir simulación
          </a>
        </div>
      </div>
    </section>
  );
}
