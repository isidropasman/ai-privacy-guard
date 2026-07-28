import { useState } from "react";
import { api } from "./api";
import { rethrow } from "./CompaniesSection";
import { EventsTable } from "./EventsTable";
import type { RuleSeverity } from "./types";
import {
  LoadState,
  PageHeader,
  severityLabels,
  Summary,
  SummaryStrip,
} from "./ui";
import { livePollMs, useAsync } from "./useAsync";

const severityOptions: readonly RuleSeverity[] = [
  "critical",
  "high",
  "medium",
  "low",
];

export function GlobalActivitySection({
  onError,
}: {
  readonly onError: (error: unknown) => void;
}) {
  const [companyId, setCompanyId] = useState("all");
  const [severity, setSeverity] = useState("all");
  const [source, setSource] = useState("all");

  const companies = useAsync(
    () => api.companies().catch(rethrow(onError)),
    [onError],
  );
  const events = useAsync(
    () => api.events({ companyId, severity, source }).catch(rethrow(onError)),
    [companyId, severity, source, onError],
    livePollMs,
  );

  const list = events.value ?? [];

  return (
    <>
      <PageHeader
        eyebrow="Super admin"
        title="Actividad global"
        description="Intercepciones reales de todas las empresas. Los eventos contienen sólo metadatos: nunca el prompt ni el fragmento detectado."
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
          label="Empresas con actividad"
          value={new Set(list.map((event) => event.companyId)).size}
        />
      </SummaryStrip>

      <div className="filters">
        <label className="filter-field">
          Empresa
          <select
            value={companyId}
            onChange={(event) => setCompanyId(event.currentTarget.value)}
          >
            <option value="all">Todas</option>
            {(companies.value ?? []).map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
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
        <label className="filter-field">
          Origen de la regla
          <select
            value={source}
            onChange={(event) => setSource(event.currentTarget.value)}
          >
            <option value="all">Todos</option>
            <option value="base">Base</option>
            <option value="custom">Personalizada</option>
          </select>
        </label>
      </div>

      <section className="panel table-panel">
        <EventsTable events={list} showCompany />
        <LoadState
          loading={events.loading}
          error={events.error}
          empty={list.length === 0}
          emptyMessage="Todavía no llegó ningún evento. Instalá el paquete de una empresa, enrolate y escribí un prompt con datos sensibles."
          onRetry={events.reload}
        />
      </section>
    </>
  );
}
