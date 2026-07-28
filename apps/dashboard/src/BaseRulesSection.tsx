import { describeBaseRules } from "../../../src/detection/createDetectorEngine";
import type { Company } from "./types";
import { PageHeader, Summary, SummaryStrip } from "./ui";

const settingLabels: Record<
  "warningsEnabled" | "financialDetectionEnabled",
  string
> = {
  warningsEnabled: "Advertir sobre datos personales",
  financialDetectionEnabled: "Detectar información financiera",
};

export function BaseRulesSection({ company }: { readonly company?: Company }) {
  const rules = describeBaseRules();
  const alwaysActiveCount = rules.filter((rule) => rule.alwaysActive).length;

  return (
    <>
      <PageHeader
        eyebrow={company === undefined ? "Super admin" : company.name}
        title="Reglas base"
        description={
          company === undefined
            ? "Detectores que ya corren en la extensión, tal como están definidos en el código fuente. Se aplican a todas las empresas y son de solo lectura."
            : `Detectores compartidos que ${company.name} recibe siempre en su extensión. Son de solo lectura: no se editan ni se desactivan por empresa.`
        }
      />

      <SummaryStrip>
        <Summary label="Total" value={rules.length} />
        <Summary label="Siempre activas" value={alwaysActiveCount} />
        <Summary
          label="Condicionadas"
          value={rules.length - alwaysActiveCount}
        />
      </SummaryStrip>

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
                  <td className="cell-wrap">{rule.description}</td>
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
