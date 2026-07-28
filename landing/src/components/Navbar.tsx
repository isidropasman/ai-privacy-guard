import { useState } from "react";

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="nav-wrap">
      <nav className="navbar" aria-label="Navegación principal">
        <a className="brand" href="#main" aria-label="Redacta, ir al inicio">
          <span className="brand-mark" aria-hidden="true">R</span>
          <span className="brand-console">
            <strong>REDACTA</strong>
            <small>
              <span className="status-dot" aria-hidden="true" />
              LOCAL PROTECTION: ACTIVE
            </small>
          </span>
        </a>
        <button
          className="menu-button"
          type="button"
          aria-expanded={open}
          aria-controls="nav-links"
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          onClick={() => setOpen((current) => !current)}
        >
          <i />
          <i />
        </button>
        <div id="nav-links" className={`nav-links ${open ? "is-open" : ""}`}>
          <a href="#como-funciona" onClick={() => setOpen(false)}>
            Cómo funciona
          </a>
          <a href="#privacidad" onClick={() => setOpen(false)}>
            Privacidad
          </a>
          <a href="#enterprise" onClick={() => setOpen(false)}>
            Visión enterprise
          </a>
          <a className="button button-small" href="#demo" onClick={() => setOpen(false)}>
            Simular incidente
          </a>
        </div>
      </nav>
    </header>
  );
}
