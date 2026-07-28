import { createRoot } from "react-dom/client";
import {
  EnrollmentPanel,
  useEnrollmentStatus,
} from "../../src/ui/EnrollmentPanel";
import "./styles.css";

function Welcome() {
  const [status, setStatus] = useEnrollmentStatus();

  return (
    <main className="welcome">
      <header>
        <div className="mark" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path d="M12 2.5 20 6v5.6c0 4.7-3.2 8.9-8 9.9-4.8-1-8-5.2-8-9.9V6l8-3.5Z" />
            <path d="m8.8 12 2.1 2.1 4.6-4.7" />
          </svg>
        </div>
        <p className="eyebrow">AI Privacy Guard</p>
        <h1>Ya estás protegido</h1>
        <p className="lead">
          La extensión revisa lo que escribís en herramientas de IA antes de que
          salga de tu navegador. El análisis ocurre en este dispositivo.
        </p>
      </header>

      {status === undefined ? (
        <p className="welcome-loading">Cargando…</p>
      ) : (
        <EnrollmentPanel
          status={status}
          onStatusChange={setStatus}
          variant="welcome"
        />
      )}
    </main>
  );
}

const container = document.querySelector("#root");
if (container !== null) createRoot(container).render(<Welcome />);
