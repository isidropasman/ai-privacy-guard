import { useState } from "react";
import { api } from "./api";
import { rethrow } from "./CompaniesSection";
import { EventsTable } from "./EventsTable";
import type { Company, RuleSeverity } from "./types";
import {
  LoadState,
  PageHeader,
  severityLabels,
  Summary,
  SummaryStrip,
} from "./ui";
import { useAsync } from "./useAsync";

const severityOptions: readonly RuleSeverity[] = [
  "critical",
  "high",
  "medium",
  "low",
];

export function EventsSection({
  company,
  onError,
}: {
  readonly company: Company;
  readonly onError: (error: unknown) => void;
}) {
  const [userId, setUserId] = useState("all");
  const [severity, setSeverity] = useState("all");

  const users = useAsync(
    () => api.users(company.id).catch(rethrow(onError)),
    [company.id, onError],
  );
  const events = useAsync(
    () =>
      api
        .companyEvents(company.id, { userId, severity })
        .catch(rethrow(onError)),
    [company.id, userId, severity, onError],
  );

  const list = events.value ?? [];

  return (
    <>
      <PageHeader
        eyebrow={company.name}
        title="Eventos"
        description="Intercepciones reales de los usuarios de esta empresa. Los eventos guardan sólo metadatos: no incluyen el prompt ni el fragmento detectado."
      />

      <SummaryStrip>
        <Summary label="Eventos" value={list.length} />
        <Summary
          label="Bloqueados"
          value={list.filter((event) => event.resolution === "blocked").length}
        />
        <Summary
          label="Reemplazados"
          value={list.filter((event) => event.resolution === "redacted").length}
        />
        <Summary
          label="Enviados igual"
          value={
            list.filter((event) => event.resolution === "sent_original").length
          }
        />
        <Summary
          label="Críticos"
          value={
            list.filter((event) => event.topSeverity === "critical").length
          }
        />
      </SummaryStrip>

      <div className="filters">
        <label className="filter-field">
          Usuario
          <select
            value={userId}
            onChange={(event) => setUserId(event.currentTarget.value)}
          >
            <option value="all">Todos</option>
            {(users.value ?? []).map((user) => (
              <option key={user.id} value={user.id}>
                {user.email}
              </option>
            ))}
          </select>
        </label>
        <label className="filter-field">
          Severidad
          <select
            value={severity}
            onChange={(event) => setSeverity(event.currentTarget.value)}
          >
            <option value="all">Todas</option>
            {severityOptions.map((option) => (
              <option key={option} value={option}>
                {severityLabels[option]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <section className="panel table-panel">
        <EventsTable events={list} />
        <LoadState
          loading={events.loading}
          error={events.error}
          empty={list.length === 0}
          emptyMessage="Esta empresa todavía no reportó eventos."
          onRetry={events.reload}
        />
      </section>
    </>
  );
}
