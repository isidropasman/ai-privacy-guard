export type IncidentFindingSeverity = "low" | "medium" | "critical";

export interface IncidentFinding {
  readonly id: string;
  readonly page: number;
  readonly category:
    | "client"
    | "email"
    | "price"
    | "margin"
    | "commercial-strategy"
    | "api-key";
  readonly severity: IncidentFindingSeverity;
  readonly originalValue: string;
  readonly protectedValue: string;
}

export interface IncidentDocument {
  readonly name: string;
  readonly pageCount: number;
  readonly size: string;
  readonly findings: readonly IncidentFinding[];
  readonly criticalFindings: number;
  readonly confidentialPercentage: number;
  readonly protectedCharacters: number;
}

export const incidentDocument = {
  name: "Propuesta_ACME_Q4.pdf",
  pageCount: 38,
  size: "2.8 MB",
  findings: [
    {
      id: "client-name-01",
      page: 2,
      category: "client",
      severity: "critical",
      originalValue: "Grupo Andino S.A.",
      protectedValue: "[CLIENT_NAME]",
    },
    {
      id: "contact-email-01",
      page: 3,
      category: "email",
      severity: "medium",
      originalValue: "maria.gomez@grupoandino.com",
      protectedValue: "[CONTACT_EMAIL]",
    },
    {
      id: "contract-value-01",
      page: 5,
      category: "price",
      severity: "critical",
      originalValue: "USD 480.000",
      protectedValue: "[CONFIDENTIAL_AMOUNT]",
    },
    {
      id: "gross-margin-01",
      page: 7,
      category: "margin",
      severity: "critical",
      originalValue: "38,4%",
      protectedValue: "[CONFIDENTIAL_MARGIN]",
    },
    {
      id: "renewal-strategy-01",
      page: 9,
      category: "commercial-strategy",
      severity: "medium",
      originalValue: "Oferta de renovación exclusiva",
      protectedValue: "[COMMERCIAL_STRATEGY]",
    },
    {
      id: "api-key-01",
      page: 11,
      category: "api-key",
      severity: "critical",
      originalValue: "sk-proj-acme-q4-demo-7f3b9c",
      protectedValue: "[API_KEY_REMOVED]",
    },
    {
      id: "client-name-02",
      page: 13,
      category: "client",
      severity: "medium",
      originalValue: "Banco del Plata",
      protectedValue: "[CLIENT_NAME]",
    },
    {
      id: "contact-email-02",
      page: 14,
      category: "email",
      severity: "low",
      originalValue: "compras@bancodelplata.com",
      protectedValue: "[CONTACT_EMAIL]",
    },
    {
      id: "contract-value-02",
      page: 16,
      category: "price",
      severity: "critical",
      originalValue: "ARS 96.500.000",
      protectedValue: "[CONFIDENTIAL_AMOUNT]",
    },
    {
      id: "gross-margin-02",
      page: 18,
      category: "margin",
      severity: "medium",
      originalValue: "31,2%",
      protectedValue: "[CONFIDENTIAL_MARGIN]",
    },
    {
      id: "market-strategy-01",
      page: 21,
      category: "commercial-strategy",
      severity: "medium",
      originalValue: "Lanzamiento antes de marzo",
      protectedValue: "[COMMERCIAL_STRATEGY]",
    },
    {
      id: "api-key-02",
      page: 22,
      category: "api-key",
      severity: "critical",
      originalValue: "rk_live_acme_q4_92d1e8",
      protectedValue: "[API_KEY_REMOVED]",
    },
    {
      id: "client-name-03",
      page: 25,
      category: "client",
      severity: "low",
      originalValue: "Logística del Sur",
      protectedValue: "[CLIENT_NAME]",
    },
    {
      id: "contact-email-03",
      page: 27,
      category: "email",
      severity: "medium",
      originalValue: "direccion@logisticadelsur.com",
      protectedValue: "[CONTACT_EMAIL]",
    },
    {
      id: "contract-value-03",
      page: 29,
      category: "price",
      severity: "medium",
      originalValue: "USD 215.000",
      protectedValue: "[CONFIDENTIAL_AMOUNT]",
    },
    {
      id: "gross-margin-03",
      page: 31,
      category: "margin",
      severity: "medium",
      originalValue: "44,7%",
      protectedValue: "[CONFIDENTIAL_MARGIN]",
    },
    {
      id: "account-strategy-01",
      page: 34,
      category: "commercial-strategy",
      severity: "medium",
      originalValue: "Plan de expansión regional",
      protectedValue: "[COMMERCIAL_STRATEGY]",
    },
    {
      id: "api-key-03",
      page: 37,
      category: "api-key",
      severity: "critical",
      originalValue: "sk-sandbox-redacta-4cc8a1",
      protectedValue: "[API_KEY_REMOVED]",
    },
  ],
  criticalFindings: 7,
  confidentialPercentage: 42,
  protectedCharacters: 14_820,
} as const satisfies IncidentDocument;
