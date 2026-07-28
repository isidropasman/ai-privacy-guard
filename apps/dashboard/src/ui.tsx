import type { ReactNode } from "react";
import type {
  CompanyPlan,
  CompanyStatus,
  EventResolution,
  PolicyDecision,
  RuleAction,
  RuleSeverity,
  RuleSource,
  UserRole,
  UserStatus,
} from "./types";

export function PageHeader({
  eyebrow = "AI Privacy Guard",
  title,
  description,
  action,
}: {
  readonly eyebrow?: string;
  readonly title: string;
  readonly description: string;
  readonly action?: ReactNode;
}) {
  return (
    <header className="page-header">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </header>
  );
}

export function SummaryStrip({ children }: { readonly children: ReactNode }) {
  return (
    <section className="summary-strip" aria-label="Resumen">
      {children}
    </section>
  );
}

export function Summary({
  label,
  value,
  hint,
}: {
  readonly label: string;
  readonly value: number | string;
  readonly hint?: string;
}) {
  return (
    <div>
      <strong>{value}</strong>
      <span>{label}</span>
      {hint === undefined ? null : <em>{hint}</em>}
    </div>
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

export function ActionBadge({ action }: { readonly action: RuleAction }) {
  return (
    <span className={`action action--${action}`}>{actionLabels[action]}</span>
  );
}

export function DecisionBadge({
  decision,
}: {
  readonly decision: PolicyDecision;
}) {
  return (
    <span className={`action action--${decisionClass[decision]}`}>
      {decisionLabels[decision]}
    </span>
  );
}

export function SourceBadge({ source }: { readonly source: RuleSource }) {
  return (
    <span className={`chip chip--${source}`}>
      {source === "base" ? "Base" : "Personalizada"}
    </span>
  );
}

export function EmptyState({ message }: { readonly message: string }) {
  return <p className="empty-state">{message}</p>;
}

export function LoadState({
  loading,
  error,
  empty,
  emptyMessage,
  onRetry,
}: {
  readonly loading: boolean;
  readonly error: string | undefined;
  readonly empty: boolean;
  readonly emptyMessage: string;
  readonly onRetry?: () => void;
}) {
  if (loading) return <p className="empty-state">Cargando…</p>;
  if (error !== undefined) {
    return (
      <p className="empty-state empty-state--error" role="alert">
        {error}
        {onRetry === undefined ? null : (
          <>
            {" "}
            <button type="button" className="text-button" onClick={onRetry}>
              Reintentar
            </button>
          </>
        )}
      </p>
    );
  }
  if (empty) return <EmptyState message={emptyMessage} />;
  return null;
}

export const severityLabels: Record<RuleSeverity, string> = {
  low: "Baja",
  medium: "Media",
  high: "Alta",
  critical: "Crítica",
};

export const actionLabels: Record<RuleAction, string> = {
  allow: "Permitir",
  warn: "Advertir",
  replace: "Reemplazar",
  block: "Bloquear",
};

export const decisionLabels: Record<PolicyDecision, string> = {
  ALLOW: "Permitido",
  WARN: "Advertido",
  BLOCK: "Bloqueado",
};

const decisionClass: Record<PolicyDecision, string> = {
  ALLOW: "allow",
  WARN: "warn",
  BLOCK: "block",
};

export const resolutionLabels: Record<EventResolution, string> = {
  blocked: "Bloqueado",
  redacted: "Reemplazado",
  sent_original: "Enviado igual",
  cancelled: "Cancelado por el usuario",
};

export const planLabels: Record<CompanyPlan, string> = {
  starter: "Starter",
  business: "Business",
  enterprise: "Enterprise",
};

export const companyStatusLabels: Record<CompanyStatus, string> = {
  active: "Activa",
  onboarding: "En onboarding",
  suspended: "Suspendida",
};

export const roleLabels: Record<UserRole, string> = {
  admin: "Administrador",
  analyst: "Analista",
  member: "Usuario",
};

export const userStatusLabels: Record<UserStatus, string> = {
  active: "Activo",
  invited: "Invitado",
  suspended: "Suspendido",
};

const dateTimeFormatter = new Intl.DateTimeFormat("es-AR", {
  dateStyle: "short",
  timeStyle: "short",
});

const dateFormatter = new Intl.DateTimeFormat("es-AR", { dateStyle: "medium" });

export function formatDateTime(value: string): string {
  return dateTimeFormatter.format(new Date(value));
}

export function formatDate(value: string): string {
  return dateFormatter.format(new Date(value));
}

export function formatRelative(value: string | null): string {
  if (value === null) return "nunca";
  const diffMs = Date.now() - Date.parse(value);
  if (diffMs < 60_000) return "recién";
  const minutes = Math.round(diffMs / 60_000);
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  return `hace ${Math.round(hours / 24)} d`;
}
