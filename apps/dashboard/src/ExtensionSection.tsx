import { useState } from "react";
import { describeBaseRules } from "../../../src/detection/createDetectorEngine";
import { api } from "./api";
import { rethrow } from "./CompaniesSection";
import type { Company } from "./types";
import {
  formatDateTime,
  formatRelative,
  LoadState,
  PageHeader,
  Summary,
  SummaryStrip,
} from "./ui";
import { useAsync } from "./useAsync";

export function ExtensionSection({
  company,
  onError,
}: {
  readonly company: Company;
  readonly onError: (error: unknown) => void;
}) {
  const baseRules = describeBaseRules();
  const [code, setCode] = useState(company.enrollmentCode);
  const [rotating, setRotating] = useState(false);

  const installations = useAsync(
    () => api.installations(company.id).catch(rethrow(onError)),
    [company.id, onError],
  );
  const rules = useAsync(
    () => api.rules(company.id).catch(rethrow(onError)),
    [company.id, onError],
  );

  const list = installations.value ?? [];
  const activeRules = (rules.value ?? []).filter((rule) => rule.enabled);

  return (
    <>
      <PageHeader
        eyebrow={company.name}
        title="Extensión de la empresa"
        description="Descargá el paquete de esta empresa y repartilo. Trae el código de enrolamiento adentro, así el empleado sólo ingresa su email."
        action={
          <a
            className="button button--primary"
            href={api.downloadUrl(company.id)}
            download
          >
            Descargar extensión
          </a>
        }
      />

      <SummaryStrip>
        <Summary label="Instalaciones" value={list.length} />
        <Summary label="Reglas base" value={baseRules.length} />
        <Summary label="Reglas propias activas" value={activeRules.length} />
        <Summary
          label="Última conexión"
          value={formatRelative(
            list.reduce<string | null>(
              (latest, installation) =>
                installation.lastSeenAt !== null &&
                (latest === null || installation.lastSeenAt > latest)
                  ? installation.lastSeenAt
                  : latest,
              null,
            ),
          )}
        />
      </SummaryStrip>

      <div className="card-grid">
        <section className="panel card-panel">
          <h2>Código de enrolamiento</h2>
          <dl className="meta-list">
            <div>
              <dt>Código actual</dt>
              <dd>
                <code>{code ?? "sin código activo"}</code>
              </dd>
            </div>
          </dl>
          <p className="card-note">
            Es el mismo para toda la empresa y viaja dentro del paquete. Rotarlo
            <strong> no desconecta</strong> las instalaciones existentes: sus
            tokens siguen siendo válidos. Sólo impide enrolar nuevas con el
            código viejo.
          </p>
          <button
            type="button"
            className="button button--quiet button--small"
            disabled={rotating}
            onClick={() => {
              setRotating(true);
              api
                .rotateCode(company.id)
                .then(setCode)
                .catch(onError)
                .finally(() => {
                  setRotating(false);
                });
            }}
          >
            {rotating ? "Rotando…" : "Rotar código"}
          </button>
        </section>

        <section className="panel card-panel">
          <h2>Cómo se instala</h2>
          <ol className="steps">
            <li>Descargá el paquete y descomprimilo.</li>
            <li>
              Abrí <code>chrome://extensions</code> y activá el modo
              desarrollador.
            </li>
            <li>
              Usá <strong>Cargar descomprimida</strong> y elegí la carpeta.
            </li>
            <li>
              Se abre sola una pestaña donde el empleado ingresa su email.
            </li>
          </ol>
          <p className="card-note">
            La carga descomprimida no se actualiza sola: una versión nueva exige
            redescargar y recargar en cada máquina.
          </p>
        </section>
      </div>

      <section className="panel table-panel">
        <div className="panel-head">
          <h2>Instalaciones</h2>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Versión</th>
                <th>Estado</th>
                <th>Enrolada</th>
                <th>Última conexión</th>
              </tr>
            </thead>
            <tbody>
              {list.map((installation) => (
                <tr key={installation.id}>
                  <td>
                    <strong>{installation.userEmail}</strong>
                    <small>{installation.id}</small>
                  </td>
                  <td>{installation.extensionVersion}</td>
                  <td>
                    <span
                      className={`chip chip--${
                        installation.status === "active"
                          ? "status-active"
                          : "status-suspended"
                      }`}
                    >
                      {installation.status === "active" ? "Activa" : "Revocada"}
                    </span>
                  </td>
                  <td>{formatDateTime(installation.enrolledAt)}</td>
                  <td>{formatRelative(installation.lastSeenAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <LoadState
          loading={installations.loading}
          error={installations.error}
          empty={list.length === 0}
          emptyMessage="Nadie se enroló todavía con el paquete de esta empresa."
          onRetry={installations.reload}
        />
      </section>
    </>
  );
}
