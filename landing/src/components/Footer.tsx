import { accessChannel } from "../data/accessChannel";

export function Footer() {
  return (
    <footer className="footer">
      <a className="brand" href="#main" aria-label="Redacta, ir al inicio">
        <span className="brand-mark" aria-hidden="true">R</span>
        <span className="brand-console">
          <strong>REDACTA</strong>
          <small>LOCAL-FIRST AI SECURITY</small>
        </span>
      </a>
      <nav aria-label="Navegación secundaria">
        <a href="#como-funciona">Seguridad</a>
        <a href="#privacidad">Privacidad</a>
        <a href="#enterprise">Visión enterprise</a>
        {accessChannel.status === "available" ? (
          <a href={accessChannel.href}>Contacto</a>
        ) : (
          <span>Contacto en preparación</span>
        )}
      </nav>
      <small>© 2026 Redacta · Control local antes del envío</small>
    </footer>
  );
}
