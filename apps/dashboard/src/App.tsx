import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "./api";
import { BaseRulesSection } from "./BaseRulesSection";
import { CompaniesSection } from "./CompaniesSection";
import { CompanyOverviewSection } from "./CompanyOverviewSection";
import { EventsSection } from "./EventsSection";
import { ExtensionSection } from "./ExtensionSection";
import { GlobalActivitySection } from "./GlobalActivitySection";
import { LoginScreen } from "./LoginScreen";
import { RulesSection } from "./RulesSection";
import type { Company } from "./types";
import { UsersSection } from "./UsersSection";

type AdminSection = "companies" | "activity" | "base-rules";
export type CompanySection =
  "overview" | "rules" | "base-rules" | "users" | "events" | "extension";

const adminNav: readonly {
  readonly id: AdminSection;
  readonly label: string;
}[] = [
  { id: "companies", label: "Empresas" },
  { id: "activity", label: "Actividad global" },
  { id: "base-rules", label: "Reglas base" },
];

const companyNav: readonly {
  readonly id: CompanySection;
  readonly label: string;
}[] = [
  { id: "overview", label: "Resumen" },
  { id: "rules", label: "Reglas personalizadas" },
  { id: "base-rules", label: "Reglas base" },
  { id: "users", label: "Usuarios" },
  { id: "events", label: "Eventos" },
  { id: "extension", label: "Extensión" },
];

export function App() {
  const [authenticated, setAuthenticated] = useState<boolean>();
  const [activeCompany, setActiveCompany] = useState<Company>();
  const [adminSection, setAdminSection] = useState<AdminSection>("companies");
  const [companySection, setCompanySection] =
    useState<CompanySection>("overview");

  useEffect(() => {
    api
      .me()
      .then(() => {
        setAuthenticated(true);
      })
      .catch(() => {
        setAuthenticated(false);
      });
  }, []);

  const handleUnauthorized = useCallback((error: unknown) => {
    if (error instanceof ApiError && error.status === 401) {
      setAuthenticated(false);
      setActiveCompany(undefined);
    }
  }, []);

  if (authenticated === undefined) {
    return <p className="boot-state">Cargando…</p>;
  }

  if (!authenticated) {
    return (
      <LoginScreen
        onAuthenticated={() => {
          setAuthenticated(true);
        }}
      />
    );
  }

  return (
    <div className="dashboard-shell">
      <aside className="sidebar">
        <div className="brand">
          <span>PG</span>
          <div>
            <strong>Privacy Guard</strong>
            <small>Consola super-admin</small>
          </div>
        </div>

        {activeCompany === undefined ? (
          <nav aria-label="Secciones de la consola">
            {adminNav.map((item) => (
              <button
                key={item.id}
                type="button"
                className={adminSection === item.id ? "nav-active" : ""}
                onClick={() => setAdminSection(item.id)}
              >
                {item.label}
              </button>
            ))}
          </nav>
        ) : (
          <>
            <div className="tenant-chip">
              <p className="eyebrow">Trabajando en</p>
              <strong>{activeCompany.name}</strong>
              <small>{activeCompany.domain}</small>
              <button
                type="button"
                className="text-button"
                onClick={() => {
                  setActiveCompany(undefined);
                  setAdminSection("companies");
                }}
              >
                ← Volver a todas las empresas
              </button>
            </div>
            <nav aria-label="Secciones de la empresa">
              {companyNav.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={companySection === item.id ? "nav-active" : ""}
                  onClick={() => setCompanySection(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </>
        )}

        <div className="sidebar-footer">
          <button
            type="button"
            className="text-button"
            onClick={() => {
              void api.logout().finally(() => {
                setAuthenticated(false);
                setActiveCompany(undefined);
              });
            }}
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="workspace">
        {activeCompany === undefined ? (
          adminSection === "companies" ? (
            <CompaniesSection
              onEnterCompany={(company) => {
                setActiveCompany(company);
                setCompanySection("overview");
              }}
              onError={handleUnauthorized}
            />
          ) : adminSection === "activity" ? (
            <GlobalActivitySection onError={handleUnauthorized} />
          ) : (
            <BaseRulesSection />
          )
        ) : companySection === "overview" ? (
          <CompanyOverviewSection
            company={activeCompany}
            onNavigate={setCompanySection}
            onError={handleUnauthorized}
          />
        ) : companySection === "rules" ? (
          <RulesSection company={activeCompany} onError={handleUnauthorized} />
        ) : companySection === "base-rules" ? (
          <BaseRulesSection company={activeCompany} />
        ) : companySection === "users" ? (
          <UsersSection company={activeCompany} onError={handleUnauthorized} />
        ) : companySection === "events" ? (
          <EventsSection company={activeCompany} onError={handleUnauthorized} />
        ) : (
          <ExtensionSection
            company={activeCompany}
            onError={handleUnauthorized}
          />
        )}
      </main>
    </div>
  );
}
