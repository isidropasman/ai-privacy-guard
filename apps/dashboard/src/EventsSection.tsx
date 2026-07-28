import { mockEvents } from "./mockData";
import { PageHeader, SeverityBadge } from "./RulesSection";
import type { RuleAction } from "./types";

export function EventsSection() {
  return (
    <>
      <PageHeader
        title="Eventos"
        description="Vista mockeada de intercepciones. No contiene prompts ni fragmentos sensibles."
      />
      <section className="panel table-panel">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Usuario</th>
                <th>Proveedor</th>
                <th>Tipo de dato</th>
                <th>Regla activada</th>
                <th>Severidad</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {mockEvents.map((event) => (
                <tr key={event.id}>
                  <td>
                    {new Intl.DateTimeFormat("es-AR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    }).format(new Date(event.occurredAt))}
                  </td>
                  <td>{event.user}</td>
                  <td>{event.provider}</td>
                  <td>{event.dataType}</td>
                  <td>
                    <strong>{event.ruleName}</strong>
                  </td>
                  <td>
                    <SeverityBadge severity={event.severity} />
                  </td>
                  <td>
                    <span className={`action action--${event.action}`}>
                      {actionLabels[event.action]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

const actionLabels: Record<RuleAction, string> = {
  allow: "Permitido",
  warn: "Advertido",
  replace: "Reemplazado",
  block: "Bloqueado",
};
