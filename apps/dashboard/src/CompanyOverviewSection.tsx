import { api } from "./api";
import type { CompanySection } from "./App";
import { rethrow } from "./CompaniesSection";
import { EventsTable } from "./EventsTable";
import type { Company, InterceptionEvent } from "./types";
import {
  companyStatusLabels,
  formatDate,
  formatRelative,
  LoadState,
  PageHeader,
  planLabels,
  SourceBadge,
  Summary,
  SummaryStrip,
} from "./ui";
import { livePollMs, useAsync } from "./useAsync";

export function CompanyOverviewSection({
  company,
  onNavigate,
  onError,
}: {
  readonly company: Company;
  readonly onNavigate: (section: CompanySection) => void;
  readonly onError: (error: unknown) => void;
}) {
  const events = useAsync(
    () => api.companyEvents(company.id).catch(rethrow(onError)),
    [company.id, onError],
    livePollMs,
  );

  const list = events.value ?? [];
  const ranking = topRules(list, 5);
  const byProvider = countBy(list, (event) => event.provider);

  return (
    <>
      <PageHeader
        eyebrow={company.industry}
        title={company.name}
        description={`${planLabels[company.plan]} · ${companyStatusLabels[company.status]} · Cliente desde ${formatDate(company.createdAt)}.`}
      />

      <SummaryStrip>
        <Summary label="Usuarios" value={company.metrics.users} />
        <Summary label="Instalaciones" value={company.metrics.installations} />
        <Summary label="Eventos" value={company.metrics.events} />
        <Summary label="Bloqueos" value={company.metrics.blocked} />
        <Summary
          label="Último evento"
          value={formatRelative(company.metrics.lastEventAt)}
        />
      </SummaryStrip>

      <div className="card-grid">
        <section className="panel card-panel">
          <h2>Despliegue</h2>
          <dl className="meta-list">
            <div>
              <dt>Instalaciones activas</dt>
              <dd>
                {company.metrics.installations} sobre {company.metrics.users}{" "}
                usuarios
              </dd>
            </div>
            <div>
              <dt>Sin conectar hace más de 7 días</dt>
              <dd>{company.metrics.staleInstallations}</dd>
            </div>
            <div>
              <dt>Licencias contratadas</dt>
              <dd>{company.seats}</dd>
            </div>
          </dl>
          <button
            type="button"
            className="button button--quiet button--small"
            onClick={() => onNavigate("extension")}
          >
            Descargar y repartir la extensión
          </button>
        </section>

        <section className="panel card-panel">
          <h2>Reglas más activadas</h2>
          {ranking.length === 0 ? (
            <p className="card-note">Todavía no llegó ningún evento.</p>
          ) : (
            <ul className="ranking">
              {ranking.map((rule) => (
                <li key={rule.ruleId}>
                  <span>
                    <strong>{rule.ruleId}</strong>
                    <SourceBadge source={rule.source} />
                  </span>
                  <em>{rule.count}</em>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel card-panel">
          <h2>Proveedores</h2>
          {Object.keys(byProvider).length === 0 ? (
            <p className="card-note">Sin actividad registrada.</p>
          ) : (
            <ul className="ranking">
              {Object.entries(byProvider).map(([provider, count]) => (
                <li key={provider}>
                  <span>
                    <strong>{provider}</strong>
                  </span>
                  <em>{count}</em>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="panel table-panel">
        <div className="panel-head">
          <h2>Últimos eventos</h2>
          <button
            type="button"
            className="text-button"
            onClick={() => onNavigate("events")}
          >
            Ver todos
          </button>
        </div>
        <EventsTable events={list.slice(0, 8)} />
        <LoadState
          loading={events.loading}
          error={events.error}
          empty={list.length === 0}
          emptyMessage="Sin eventos todavía. Descargá el paquete, enrolá una instalación y probá un prompt con una API key."
          onRetry={events.reload}
        />
      </section>
    </>
  );
}

interface RuleUsage {
  readonly ruleId: string;
  readonly source: "base" | "custom";
  readonly count: number;
}

function topRules(
  events: readonly InterceptionEvent[],
  limit: number,
): readonly RuleUsage[] {
  const byRule = new Map<string, RuleUsage>();

  for (const event of events) {
    for (const rule of event.rules) {
      const current = byRule.get(rule.ruleId);
      byRule.set(rule.ruleId, {
        ruleId: rule.ruleId,
        source: rule.ruleSource,
        count: (current?.count ?? 0) + 1,
      });
    }
  }

  return [...byRule.values()]
    .sort((left, right) => right.count - left.count)
    .slice(0, limit);
}

function countBy<Item>(
  items: readonly Item[],
  key: (item: Item) => string,
): Readonly<Record<string, number>> {
  const result: Record<string, number> = {};
  for (const item of items) {
    const value = key(item);
    result[value] = (result[value] ?? 0) + 1;
  }
  return result;
}
