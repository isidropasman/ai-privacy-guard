import { useState } from "react";
import { api } from "./api";
import { rethrow } from "./CompaniesSection";
import type { Company } from "./types";
import {
  formatRelative,
  LoadState,
  PageHeader,
  roleLabels,
  Summary,
  SummaryStrip,
  userStatusLabels,
} from "./ui";
import { useAsync } from "./useAsync";

export function UsersSection({
  company,
  onError,
}: {
  readonly company: Company;
  readonly onError: (error: unknown) => void;
}) {
  const [query, setQuery] = useState("");
  const state = useAsync(
    () => api.users(company.id).catch(rethrow(onError)),
    [company.id, onError],
  );

  const users = state.value ?? [];
  const needle = query.trim().toLowerCase();
  const filtered = users.filter(
    (user) =>
      needle.length === 0 ||
      user.email.toLowerCase().includes(needle) ||
      user.name.toLowerCase().includes(needle) ||
      user.area.toLowerCase().includes(needle),
  );

  return (
    <>
      <PageHeader
        eyebrow={company.name}
        title="Usuarios"
        description="Personas de la empresa alcanzadas por la extensión. Se crean al enrolarse: el email lo declara cada usuario, no está verificado."
      />

      <SummaryStrip>
        <Summary label="Usuarios" value={users.length} />
        <Summary
          label="Con extensión instalada"
          value={users.filter((user) => user.installations > 0).length}
        />
        <Summary
          label="Sin instalar"
          value={users.filter((user) => user.installations === 0).length}
        />
        <Summary label="Licencias" value={company.seats} />
      </SummaryStrip>

      <div className="filters">
        <label className="filter-field">
          Buscar
          <input
            value={query}
            placeholder="Nombre, email o área"
            onChange={(event) => setQuery(event.currentTarget.value)}
          />
        </label>
      </div>

      <section className="panel table-panel">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Área</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Instalaciones</th>
                <th>Eventos</th>
                <th>Última actividad</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={user.id}>
                  <td>
                    <strong>{user.name === "" ? user.email : user.name}</strong>
                    <small>{user.email}</small>
                  </td>
                  <td>{user.area === "" ? "—" : user.area}</td>
                  <td>{roleLabels[user.role]}</td>
                  <td>
                    <span className={`chip chip--user-${user.status}`}>
                      {userStatusLabels[user.status]}
                    </span>
                  </td>
                  <td>
                    {user.installations === 0 ? (
                      <span className="chip chip--enrollment-pending">
                        Sin instalar
                      </span>
                    ) : (
                      user.installations
                    )}
                  </td>
                  <td>{user.events}</td>
                  <td>{formatRelative(user.lastSeenAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <LoadState
          loading={state.loading}
          error={state.error}
          empty={filtered.length === 0}
          emptyMessage="Ningún usuario coincide con la búsqueda."
          onRetry={state.reload}
        />
      </section>
    </>
  );
}
