import { useEffect, useMemo, useState } from "react";
import { createDetectorEngine } from "../../src/detection/createDetectorEngine";
import {
  SettingsRepository,
  type PrivacyGuardSettings,
} from "../../src/storage/SettingsRepository";
import "./styles.css";

interface PopupAppProps {
  readonly repository: SettingsRepository;
}

export function PopupApp({ repository }: PopupAppProps) {
  const [settings, setSettings] = useState<PrivacyGuardSettings>();
  const [term, setTerm] = useState("");
  const [testResult, setTestResult] = useState<string>();

  useEffect(() => {
    let active = true;
    void repository.get().then((value) => {
      if (active) setSettings(value);
    });
    return () => {
      active = false;
    };
  }, [repository]);

  const interventions = useMemo(
    () =>
      settings === undefined
        ? 0
        : settings.counters.warnedCount + settings.counters.blockedCount,
    [settings],
  );

  const persist = async (next: PrivacyGuardSettings) => {
    setSettings(next);
    await repository.save(next);
  };

  const toggle = (
    key: "warningsEnabled" | "financialDetectionEnabled" | "strictSecrets",
  ) => {
    if (settings === undefined) return;
    void persist({ ...settings, [key]: !settings[key] });
  };

  const addTerm = (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (settings === undefined) return;
    const normalized = term.trim();
    if (
      normalized.length === 0 ||
      settings.confidentialTerms.includes(normalized)
    ) {
      return;
    }
    void persist({
      ...settings,
      confidentialTerms: [...settings.confidentialTerms, normalized],
    });
    setTerm("");
  };

  const removeTerm = (value: string) => {
    if (settings === undefined) return;
    void persist({
      ...settings,
      confidentialTerms: settings.confidentialTerms.filter(
        (termValue) => termValue !== value,
      ),
    });
  };

  const runSafeTest = () => {
    if (settings === undefined) return;
    const findings = createDetectorEngine(settings).detect({
      text: "Explicame de manera sencilla qué es Kubernetes.",
      configuredTerms: settings.confidentialTerms,
    });
    setTestResult(
      findings.length === 0
        ? "Prueba completada: el prompt seguro se permite."
        : "La configuración actual encontró una coincidencia.",
    );
  };

  if (settings === undefined) {
    return <main className="popup popup--loading">Cargando protección…</main>;
  }

  return (
    <main className="popup">
      <header className="header">
        <div className="mark" aria-hidden="true" />
        <div>
          <p className="eyebrow">AI Privacy Guard</p>
          <h1>Protección activa</h1>
        </div>
        <span className="status-dot" aria-label="Activa" />
      </header>

      <section className="provider" aria-label="Proveedor protegido">
        <span className="provider-icon">AI</span>
        <div>
          <p>Proveedor actual</p>
          <strong>ChatGPT</strong>
        </div>
        <span className="protected">Protegido</span>
      </section>

      <section className="stats" aria-label="Actividad local">
        <div>
          <strong>{interventions}</strong>
          <span>intervenciones</span>
        </div>
        <div>
          <strong>{settings.counters.blockedCount}</strong>
          <span>bloqueos</span>
        </div>
        <div>
          <strong>{settings.counters.redactedCount}</strong>
          <span>protegidos</span>
        </div>
      </section>

      <section className="settings-section">
        <h2>Protección</h2>
        <Toggle
          label="Advertir sobre datos personales"
          checked={settings.warningsEnabled}
          onChange={() => toggle("warningsEnabled")}
        />
        <Toggle
          label="Detectar información financiera"
          checked={settings.financialDetectionEnabled}
          onChange={() => toggle("financialDetectionEnabled")}
        />
        <Toggle
          label="Bloqueo estricto de secretos"
          checked={settings.strictSecrets}
          onChange={() => toggle("strictSecrets")}
        />
      </section>

      <section className="settings-section terms-section">
        <div className="section-heading">
          <h2>Términos confidenciales</h2>
          <span>{settings.confidentialTerms.length}</span>
        </div>
        <form onSubmit={addTerm}>
          <input
            name="confidential-term"
            value={term}
            onChange={(event) => setTerm(event.currentTarget.value)}
            placeholder="Proyecto, cliente o repositorio"
            maxLength={100}
            aria-label="Nuevo término confidencial"
          />
          <button data-action="add-term" type="submit">
            Agregar
          </button>
        </form>
        {settings.confidentialTerms.length > 0 ? (
          <ul className="term-list">
            {settings.confidentialTerms.map((value) => (
              <li key={value}>
                <span>{value}</span>
                <button
                  type="button"
                  aria-label={`Eliminar ${value}`}
                  onClick={() => removeTerm(value)}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty-terms">
            Agregá nombres que sólo deberían usarse dentro de tu organización.
          </p>
        )}
      </section>

      <button className="test-button" type="button" onClick={runSafeTest}>
        Ejecutar prueba segura
      </button>
      {testResult !== undefined ? (
        <p className="test-result" role="status">
          {testResult}
        </p>
      ) : null}

      <p className="privacy-note">
        El análisis ocurre en este dispositivo. Los prompts no se guardan ni se
        envían a servidores.
      </p>
    </main>
  );
}

interface ToggleProps {
  readonly label: string;
  readonly checked: boolean;
  readonly onChange: () => void;
}

function Toggle({ label, checked, onChange }: ToggleProps) {
  return (
    <label className="toggle-row">
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span className="toggle" aria-hidden="true" />
    </label>
  );
}

function App() {
  const repository = useMemo(
    () => new SettingsRepository(browser.storage.local),
    [],
  );
  return <PopupApp repository={repository} />;
}

export default App;
