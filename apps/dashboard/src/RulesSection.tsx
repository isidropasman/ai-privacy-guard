import { useState } from "react";
import { api, type RulePayload } from "./api";
import { rethrow } from "./CompaniesSection";
import type { Company, CustomRule, RuleAction, RuleSeverity } from "./types";
import {
  ActionBadge,
  formatDate,
  LoadState,
  PageHeader,
  SeverityBadge,
  Summary,
  SummaryStrip,
} from "./ui";
import { useAsync } from "./useAsync";

interface RuleFormState {
  readonly id?: string;
  readonly name: string;
  readonly description: string;
  readonly keywords: string;
  readonly severity: RuleSeverity;
  readonly action: RuleAction;
  readonly enabled: boolean;
}

const emptyRule: RuleFormState = {
  name: "",
  description: "",
  keywords: "",
  severity: "medium",
  action: "warn",
  enabled: true,
};

export function RulesSection({
  company,
  onError,
}: {
  readonly company: Company;
  readonly onError: (error: unknown) => void;
}) {
  const [editing, setEditing] = useState<RuleFormState>();
  const state = useAsync(
    () => api.rules(company.id).catch(rethrow(onError)),
    [company.id, onError],
  );

  const rules = state.value ?? [];

  const toggle = (rule: CustomRule) => {
    void api
      .updateRule(company.id, rule.id, {
        ...toPayload(rule),
        enabled: !rule.enabled,
      })
      .then(state.reload)
      .catch(onError);
  };

  return (
    <>
      <PageHeader
        eyebrow={company.name}
        title="Reglas personalizadas"
        description="Términos internos de esta empresa. Se administran acá, pero todavía no bajan a la extensión: sólo se aplican las reglas base."
        action={
          <button
            className="button button--primary"
            type="button"
            onClick={() => setEditing(emptyRule)}
          >
            Nueva regla
          </button>
        }
      />

      <SummaryStrip>
        <Summary label="Total" value={rules.length} />
        <Summary
          label="Activas"
          value={rules.filter((rule) => rule.enabled).length}
        />
        <Summary
          label="Bloqueo"
          value={rules.filter((rule) => rule.action === "block").length}
        />
        <Summary
          label="Keywords"
          value={rules.reduce((total, rule) => total + rule.keywords.length, 0)}
        />
      </SummaryStrip>

      <section className="panel table-panel">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Regla</th>
                <th>Keywords</th>
                <th>Severidad</th>
                <th>Acción</th>
                <th>Estado</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rules.map((rule) => (
                <tr key={rule.id}>
                  <td>
                    <strong>{rule.name}</strong>
                    <small>
                      {rule.description === ""
                        ? `Actualizada ${formatDate(rule.updatedAt)}`
                        : rule.description}
                    </small>
                  </td>
                  <td>
                    <div className="tag-list">
                      {rule.keywords.map((keyword) => (
                        <span key={keyword}>{keyword}</span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <SeverityBadge severity={rule.severity} />
                  </td>
                  <td>
                    <ActionBadge action={rule.action} />
                  </td>
                  <td>
                    <button
                      type="button"
                      className={
                        rule.enabled
                          ? "status-toggle status-toggle--on"
                          : "status-toggle"
                      }
                      aria-pressed={rule.enabled}
                      onClick={() => toggle(rule)}
                    >
                      {rule.enabled ? "Activa" : "Inactiva"}
                    </button>
                  </td>
                  <td>
                    <button
                      className="text-button"
                      type="button"
                      onClick={() =>
                        setEditing({
                          id: rule.id,
                          name: rule.name,
                          description: rule.description,
                          keywords: rule.keywords.join("\n"),
                          severity: rule.severity,
                          action: rule.action,
                          enabled: rule.enabled,
                        })
                      }
                    >
                      Editar
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
          empty={rules.length === 0}
          emptyMessage="Esta empresa todavía no definió reglas propias. Las reglas base siguen aplicándose."
          onRetry={state.reload}
        />
      </section>

      {editing === undefined ? null : (
        <RuleEditor
          companyName={company.name}
          initial={editing}
          onCancel={() => setEditing(undefined)}
          onSave={(form) => {
            const payload: RulePayload = {
              name: form.name.trim(),
              description: form.description.trim(),
              keywords: normalizeKeywords(form.keywords),
              severity: form.severity,
              action: form.action,
              enabled: form.enabled,
            };
            const request =
              form.id === undefined
                ? api.createRule(company.id, payload)
                : api.updateRule(company.id, form.id, payload);

            void request
              .then(() => {
                setEditing(undefined);
                state.reload();
              })
              .catch(onError);
          }}
        />
      )}
    </>
  );
}

function toPayload(rule: CustomRule): RulePayload {
  return {
    name: rule.name,
    description: rule.description,
    keywords: rule.keywords,
    severity: rule.severity,
    action: rule.action,
    enabled: rule.enabled,
  };
}

function RuleEditor({
  companyName,
  initial,
  onCancel,
  onSave,
}: {
  readonly companyName: string;
  readonly initial: RuleFormState;
  readonly onCancel: () => void;
  readonly onSave: (rule: RuleFormState) => void;
}) {
  const [form, setForm] = useState(initial);
  const [error, setError] = useState<string>();
  const update = <Key extends keyof RuleFormState>(
    key: Key,
    value: RuleFormState[Key],
  ) => setForm((current) => ({ ...current, [key]: value }));

  return (
    <div className="drawer-layer">
      <form
        className="drawer"
        onSubmit={(event) => {
          event.preventDefault();
          if (form.name.trim().length === 0) {
            setError("Ingresá un nombre.");
            return;
          }
          if (normalizeKeywords(form.keywords).length === 0) {
            setError("Agregá al menos una keyword.");
            return;
          }
          onSave(form);
        }}
      >
        <header>
          <div>
            <p className="eyebrow">{companyName}</p>
            <h2>{form.id === undefined ? "Nueva regla" : "Editar regla"}</h2>
          </div>
          <button type="button" onClick={onCancel} aria-label="Cerrar">
            ×
          </button>
        </header>
        <div className="form-content">
          <label>
            Nombre
            <input
              value={form.name}
              maxLength={120}
              onChange={(event) => update("name", event.currentTarget.value)}
            />
          </label>
          <label>
            Descripción
            <input
              value={form.description}
              maxLength={200}
              placeholder="Para qué sirve esta regla"
              onChange={(event) =>
                update("description", event.currentTarget.value)
              }
            />
          </label>
          <label>
            Keywords
            <textarea
              value={form.keywords}
              onChange={(event) =>
                update("keywords", event.currentTarget.value)
              }
              placeholder={"Una por línea\nProyecto Boreal\nBoreal-2026"}
            />
            <small>Una keyword por línea. Se eliminan duplicados.</small>
          </label>
          <div className="form-columns">
            <label>
              Severidad
              <select
                value={form.severity}
                onChange={(event) =>
                  update("severity", event.currentTarget.value as RuleSeverity)
                }
              >
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
                <option value="critical">Crítica</option>
              </select>
            </label>
            <label>
              Acción
              <select
                value={form.action}
                onChange={(event) =>
                  update("action", event.currentTarget.value as RuleAction)
                }
              >
                <option value="allow">Permitir</option>
                <option value="warn">Advertir</option>
                <option value="replace">Reemplazar</option>
                <option value="block">Bloquear</option>
              </select>
            </label>
          </div>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(event) =>
                update("enabled", event.currentTarget.checked)
              }
            />
            Activar esta regla
          </label>
          {error === undefined ? null : (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
        </div>
        <footer>
          <button
            className="button button--quiet"
            type="button"
            onClick={onCancel}
          >
            Cancelar
          </button>
          <button className="button button--primary">Guardar regla</button>
        </footer>
      </form>
    </div>
  );
}

function normalizeKeywords(value: string): string[] {
  return [
    ...new Set(
      value
        .split(/\r?\n/u)
        .map((keyword) => keyword.trim())
        .filter(Boolean),
    ),
  ];
}
