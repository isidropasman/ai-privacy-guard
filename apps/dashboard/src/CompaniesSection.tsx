import { useState } from "react";
import { api } from "./api";
import type { Company } from "./types";
import {
  companyStatusLabels,
  formatRelative,
  LoadState,
  PageHeader,
  planLabels,
  Summary,
  SummaryStrip,
} from "./ui";
import { useAsync } from "./useAsync";

export function CompaniesSection({
  onEnterCompany,
  onError,
}: {
  readonly onEnterCompany: (company: Company) => void;
  readonly onError: (error: unknown) => void;
}) {
  const [query, setQuery] = useState("");
  const state = useAsync(
    () => api.companies().catch(rethrow(onError)),
    [onError],
  );

  const companies = state.value ?? [];
  const needle = query.trim().toLowerCase();
  const filtered = companies.filter(
    (company) =>
      needle.length === 0 ||
      company.name.toLowerCase().includes(needle) ||
      company.domain.toLowerCase().includes(needle) ||
      company.industry.toLowerCase().includes(needle),
  );

  const totals = companies.reduce(
    (accumulator, company) => ({
      users: accumulator.users + company.metrics.users,
      installations: accumulator.installations + company.metrics.installations,
      events: accumulator.events + company.metrics.events,
      blocked: accumulator.blocked + company.metrics.blocked,
    }),
    { users: 0, installations: 0, events: 0, blocked: 0 },
  );

  return (
    <>
      <PageHeader
        eyebrow="Super admin"
        title="Empresas"
        description="Todas las organizaciones que usan la plataforma. Cada una descarga su propio paquete de la extensión con las reglas base compartidas."
      />

      <SummaryStrip>
        <Summary label="Empresas" value={companies.length} />
        <Summary label="Usuarios" value={totals.users} />
        <Summary label="Instalaciones" value={totals.installations} />
        <Summary label="Eventos" value={totals.events} />
        <Summary label="Bloqueos" value={totals.blocked} />
      </SummaryStrip>

      <div className="filters">
        <label className="filter-field">
          Buscar
          <input
            value={query}
            placeholder="Nombre, dominio o industria"
            onChange={(event) => setQuery(event.currentTarget.value)}
          />
        </label>
      </div>

      <section className="panel table-panel">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Empresa</th>
                <th>Plan</th>
                <th>Estado</th>
                <th>Usuarios</th>
                <th>Instalaciones</th>
                <th>Reglas propias</th>
                <th>Eventos</th>
                <th>Bloqueos</th>
                <th>Último evento</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((company) => (
                <tr key={company.id}>
                  <td>
                    <strong>{company.name}</strong>
                    <small>
                      {company.industry} · {company.domain}
                    </small>
                  </td>
                  <td>
                    <span className={`chip chip--plan-${company.plan}`}>
                      {planLabels[company.plan]}
                    </span>
                  </td>
                  <td>
                    <span className={`chip chip--status-${company.status}`}>
                      {companyStatusLabels[company.status]}
                    </span>
                  </td>
                  <td>
                    {company.metrics.users}
                    <small>de {company.seats} licencias</small>
                  </td>
                  <td>{company.metrics.installations}</td>
                  <td>
                    {company.metrics.activeRules}
                    <small>de {company.metrics.rules} definidas</small>
                  </td>
                  <td>{company.metrics.events}</td>
                  <td>{company.metrics.blocked}</td>
                  <td>{formatRelative(company.metrics.lastEventAt)}</td>
                  <td>
                    <button
                      type="button"
                      className="button button--primary button--small"
                      onClick={() => onEnterCompany(company)}
                    >
                      Ingresar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <LoadState
          loading={state.loading}
          error={state.error}
          empty={filtered.length === 0}
          emptyMessage="Ninguna empresa coincide con la búsqueda."
          onRetry={state.reload}
        />
      </section>
    </>
  );
}

export function rethrow(onError: (error: unknown) => void) {
  return (error: unknown): never => {
    onError(error);
    throw error;
  };
}
