import { useEffect, useState } from "react";
import { BaseRulesSection } from "./BaseRulesSection";
import { EventsSection } from "./EventsSection";
import { RulesSection } from "./RulesSection";
import { loadRules, saveRules } from "./storage";
import type { CustomRule } from "./types";

type Section = "base-rules" | "rules" | "events";

export function App() {
  const [section, setSection] = useState<Section>("base-rules");
  const [rules, setRules] = useState<readonly CustomRule[]>(loadRules);

  useEffect(() => {
    saveRules(rules);
  }, [rules]);

  return (
    <div className="dashboard-shell">
      <aside className="sidebar">
        <div className="brand">
          <span>PG</span>
          <div>
            <strong>Privacy Guard</strong>
            <small>Dashboard local</small>
          </div>
        </div>
        <nav aria-label="Secciones del dashboard">
          <button
            type="button"
            className={section === "base-rules" ? "nav-active" : ""}
            onClick={() => setSection("base-rules")}
          >
            Reglas base
          </button>
          <button
            type="button"
            className={section === "rules" ? "nav-active" : ""}
            onClick={() => setSection("rules")}
          >
            Reglas personalizadas
          </button>
          <button
            type="button"
            className={section === "events" ? "nav-active" : ""}
            onClick={() => setSection("events")}
          >
            Eventos
          </button>
        </nav>
        <p className="scope-note">
          Prototipo local. Todavía no está conectado con la extensión.
        </p>
      </aside>
      <main className="workspace">
        {section === "base-rules" ? (
          <BaseRulesSection />
        ) : section === "rules" ? (
          <RulesSection rules={rules} onChange={setRules} />
        ) : (
          <EventsSection />
        )}
      </main>
    </div>
  );
}
