import type { InterceptionEvent } from "./types";
import {
  DecisionBadge,
  formatDateTime,
  resolutionLabels,
  SeverityBadge,
  SourceBadge,
} from "./ui";

/**
 * Un evento representa un envío, no una regla: puede tener varias reglas
 * activadas. La tabla muestra la principal y cuántas más hubo.
 */
export function EventsTable({
  events,
  showCompany = false,
  onCompanyClick,
}: {
  readonly events: readonly InterceptionEvent[];
  readonly showCompany?: boolean;
  readonly onCompanyClick?: (companyId: string) => void;
}) {
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Fecha</th>
            {showCompany ? <th>Empresa</th> : null}
            <th>Usuario</th>
            <th>Proveedor</th>
            <th>Regla activada</th>
            <th>Categoría</th>
            <th>Severidad</th>
            <th>Decisión</th>
            <th>Resolución</th>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => {
            const primary = pickPrimaryRule(event);
            const extra = event.rules.length - 1;

            return (
              <tr key={event.id}>
                <td>{formatDateTime(event.occurredAt)}</td>
                {showCompany ? (
                  <td>
                    {onCompanyClick === undefined ? (
                      event.companyName
                    ) : (
                      <button
                        type="button"
                        className="text-button"
                        onClick={() => onCompanyClick(event.companyId)}
                      >
                        {event.companyName}
                      </button>
                    )}
                  </td>
                ) : null}
                <td>{event.userEmail}</td>
                <td>{event.provider}</td>
                <td>
                  <strong>{primary?.ruleId ?? "—"}</strong>
                  <small>
                    {primary === undefined ? null : (
                      <SourceBadge source={primary.ruleSource} />
                    )}
                    {extra > 0
                      ? ` +${String(extra)} regla${extra === 1 ? "" : "s"}`
                      : ""}
                  </small>
                </td>
                <td>{primary?.category ?? "—"}</td>
                <td>
                  <SeverityBadge severity={event.topSeverity} />
                </td>
                <td>
                  <DecisionBadge decision={event.decision} />
                </td>
                <td>{resolutionLabels[event.resolution]}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const severityRank = { low: 0, medium: 1, high: 2, critical: 3 } as const;

function pickPrimaryRule(event: InterceptionEvent) {
  return [...event.rules].sort(
    (left, right) => severityRank[right.severity] - severityRank[left.severity],
  )[0];
}
