import { useState } from "react";
import type { CustomRule, RuleAction, RuleSeverity } from "./types";

interface RuleFormState {
  readonly id?: string;
  readonly name: string;
  readonly keywords: string;
  readonly severity: RuleSeverity;
  readonly action: RuleAction;
  readonly enabled: boolean;
  readonly createdAt?: string;
}

const emptyRule: RuleFormState = {
  name: "",
  keywords: "",
  severity: "medium",
  action: "warn",
  enabled: true,
};

export function RulesSection({
  rules,
  onChange,
}: {
  readonly rules: readonly CustomRule[];
  readonly onChange: (rules: readonly CustomRule[]) => void;
}) {
  const [editing, setEditing] = useState<RuleFormState>();

  return (
    <>
      <PageHeader
        title="Reglas personalizadas"
        description="Definí términos internos y la respuesta esperada. Los cambios se guardan solamente en este navegador."
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

      <section className="summary-strip" aria-label="Resumen de reglas">
        <Summary label="Total" value={rules.length} />
        <Summary
          label="Activas"
          value={rules.filter((rule) => rule.enabled).length}
        />
        <Summary
          label="Bloqueo"
          value={rules.filter((rule) => rule.action === "block").length}
        />
      </section>

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
                      Actualizada{" "}
                      {new Intl.DateTimeFormat("es-AR").format(
                        new Date(rule.updatedAt),
                      )}
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
                    <span className={`action action--${rule.action}`}>
                      {actionLabels[rule.action]}
                    </span>
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
                      onClick={() =>
                        onChange(
                          rules.map((current) =>
                            current.id === rule.id
                              ? {
                                  ...current,
                                  enabled: !current.enabled,
                                  updatedAt: new Date().toISOString(),
                                }
                              : current,
                          ),
                        )
                      }
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
                          keywords: rule.keywords.join("\n"),
                          severity: rule.severity,
                          action: rule.action,
                          enabled: rule.enabled,
                          createdAt: rule.createdAt,
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
      </section>

      {editing === undefined ? null : (
        <RuleEditor
          initial={editing}
          onCancel={() => setEditing(undefined)}
          onSave={(form) => {
            const now = new Date().toISOString();
            const saved: CustomRule = {
              id: form.id ?? crypto.randomUUID(),
              name: form.name.trim(),
              keywords: normalizeKeywords(form.keywords),
              severity: form.severity,
              action: form.action,
              enabled: form.enabled,
              createdAt: form.createdAt ?? now,
              updatedAt: now,
            };
            onChange(
              form.id === undefined
                ? [saved, ...rules]
                : rules.map((rule) => (rule.id === form.id ? saved : rule)),
            );
            setEditing(undefined);
          }}
        />
      )}
    </>
  );
}

function RuleEditor({
  initial,
  onCancel,
  onSave,
}: {
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
            <p className="eyebrow">Configuración local</p>
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

export function PageHeader({
  title,
  description,
  action,
}: {
  readonly title: string;
  readonly description: string;
  readonly action?: React.ReactNode;
}) {
  return (
    <header className="page-header">
      <div>
        <p className="eyebrow">AI Privacy Guard</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </header>
  );
}

export function SeverityBadge({
  severity,
}: {
  readonly severity: RuleSeverity;
}) {
  return (
    <span className={`severity severity--${severity}`}>
      {severityLabels[severity]}
    </span>
  );
}

function Summary({
  label,
  value,
}: {
  readonly label: string;
  readonly value: number;
}) {
  return (
    <div>
      <strong>{value}</strong>
      <span>{label}</span>
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

const severityLabels: Record<RuleSeverity, string> = {
  low: "Baja",
  medium: "Media",
  high: "Alta",
  critical: "Crítica",
};

const actionLabels: Record<RuleAction, string> = {
  allow: "Permitir",
  warn: "Advertir",
  replace: "Reemplazar",
  block: "Bloquear",
};
