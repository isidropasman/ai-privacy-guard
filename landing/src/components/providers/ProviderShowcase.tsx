import { providers, providerStatusLabel } from "../../data/providers";

export function ProviderShowcase() {
  return (
    <section
      id="proveedores"
      className="provider-showcase section"
      aria-labelledby="provider-showcase-title"
    >
      <div className="provider-showcase__heading">
        <div>
          <p className="eyebrow">Redacta en acción</p>
          <h2 id="provider-showcase-title">
            Rick vive dentro de la ventana del proveedor.
          </h2>
        </div>
        <p>
          Redacta se ancla a la interfaz del proveedor y revisa el prompt antes
          de que salga del navegador. No reemplaza la herramienta que tu equipo
          ya usa.
        </p>
      </div>

      <ul className="provider-showcase__providers" aria-label="Proveedores">
        {providers.map((provider) => (
          <li key={provider.id} data-status={provider.status}>
            <img
              className={`provider-logo provider-logo--${provider.id}`}
              src={provider.logo}
              alt=""
              width="48"
              height="48"
              loading="lazy"
            />
            <div>
              <strong>{provider.name}</strong>
              <small>{provider.detail}</small>
            </div>
            <span className={`provider-status provider-status--${provider.status}`}>
              {providerStatusLabel[provider.status]}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
