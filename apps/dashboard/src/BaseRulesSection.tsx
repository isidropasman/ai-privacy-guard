import { describeBaseRules } from "../../../src/detection/createDetectorEngine";
import { PageHeader } from "./RulesSection";

const settingLabels: Record<"warningsEnabled" | "financialDetectionEnabled", string> = {
  warningsEnabled: "Advertir sobre datos personales",
  financialDetectionEnabled: "Detectar información financiera",
};

export function BaseRulesSection() {
  const rules = describeBaseRules();
  const alwaysActiveCount = rules.filter((rule) => rule.alwaysActive).length;

  return (
    <>
      <PageHeader
        title="Reglas base"
        description="Detectores que ya corren en la extensión, tal como están definidos en el código fuente. Son de solo lectura: no se editan desde acá."
      />

      <section className="summary-strip" aria-label="Resumen de reglas base">
        <Summary label="Total" value={rules.length} />
        <Summary label="Siempre activas" value={alwaysActiveCount} />
        <Summary
          label="Condicionadas"
          value={rules.length - alwaysActiveCount}
        />
      </section>

      <section className="panel table-panel">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Detector</th>
                <th>Descripción</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((rule) => (
                <tr key={rule.id}>
                  <td>
                    <strong>{rule.label}</strong>
                    <small>{rule.id}</small>
                  </td>
                  <td>{rule.description}</td>
                  <td>
                    {rule.alwaysActive ? (
                      <span className="status-toggle status-toggle--on">
                        Siempre activo
                      </span>
                    ) : (
                      <span className="status-toggle">
                        Depende de &quot;
                        {rule.requiresSetting === undefined
                          ? "un ajuste"
                          : settingLabels[rule.requiresSetting]}
                        &quot;
                      </span>
                    )}
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
