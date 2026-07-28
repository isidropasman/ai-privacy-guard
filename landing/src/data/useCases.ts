export type IncidentStateId = "original" | "findings" | "protected";

export type IncidentUseCaseId =
  | "contract"
  | "code"
  | "commercial-proposal"
  | "customer-data"
  | "uploaded";

export type IncidentFindingSeverity = "medium" | "critical";

export interface IncidentFinding {
  readonly id: string;
  readonly label: string;
  readonly severity: IncidentFindingSeverity;
  readonly originalValue: string;
  readonly replacement: string;
}

export interface IncidentSegment {
  readonly text: string;
  readonly tone: "plain" | "sensitive" | "replacement";
  readonly findingId?: string;
}

export interface IncidentState {
  readonly label: string;
  readonly status: string;
  readonly segments: readonly IncidentSegment[];
}

export interface IncidentUseCase {
  readonly id: IncidentUseCaseId;
  readonly label: string;
  readonly glyph: string;
  readonly fileName: string;
  readonly context: string;
  readonly findings: readonly IncidentFinding[];
  readonly states: Readonly<Record<IncidentStateId, IncidentState>>;
}

export const useCases = [
  {
    id: "contract",
    label: "Contrato",
    glyph: "§",
    fileName: "acuerdo-marco.txt",
    context: "Partes, montos y cláusulas confidenciales",
    findings: [
      {
        id: "contract-party",
        label: "Parte contractual",
        severity: "medium",
        originalValue: "Grupo Litoral S.A.",
        replacement: "[CONTRACT_PARTY]",
      },
      {
        id: "contract-amount",
        label: "Monto del contrato",
        severity: "medium",
        originalValue: "USD 480.000",
        replacement: "[CONTRACT_AMOUNT]",
      },
      {
        id: "contract-clause",
        label: "Cláusula confidencial",
        severity: "critical",
        originalValue: "renovación automática por 24 meses",
        replacement: "[CONFIDENTIAL_CLAUSE]",
      },
    ],
    states: {
      original: {
        label: "Documento original",
        status: "3 datos sensibles todavía visibles",
        segments: [
          {
            text: "ACUERDO MARCO\n\nEntre ",
            tone: "plain",
          },
          {
            text: "Grupo Litoral S.A.",
            tone: "plain",
          },
          {
            text: " y Redacta Demo.\nValor total: ",
            tone: "plain",
          },
          {
            text: "USD 480.000",
            tone: "plain",
          },
          {
            text: ".\nCláusula 8: ",
            tone: "plain",
          },
          {
            text: "renovación automática por 24 meses",
            tone: "plain",
          },
          {
            text: ".",
            tone: "plain",
          },
        ],
      },
      findings: {
        label: "Hallazgos",
        status: "3 coincidencias señaladas",
        segments: [
          {
            text: "ACUERDO MARCO\n\nEntre ",
            tone: "plain",
          },
          {
            text: "Grupo Litoral S.A.",
            tone: "sensitive",
            findingId: "contract-party",
          },
          {
            text: " y Redacta Demo.\nValor total: ",
            tone: "plain",
          },
          {
            text: "USD 480.000",
            tone: "sensitive",
            findingId: "contract-amount",
          },
          {
            text: ".\nCláusula 8: ",
            tone: "plain",
          },
          {
            text: "renovación automática por 24 meses",
            tone: "sensitive",
            findingId: "contract-clause",
          },
          {
            text: ".",
            tone: "plain",
          },
        ],
      },
      protected: {
        label: "Versión protegida",
        status: "3 valores reemplazados localmente",
        segments: [
          {
            text: "ACUERDO MARCO\n\nEntre ",
            tone: "plain",
          },
          {
            text: "[CONTRACT_PARTY]",
            tone: "replacement",
            findingId: "contract-party",
          },
          {
            text: " y Redacta Demo.\nValor total: ",
            tone: "plain",
          },
          {
            text: "[CONTRACT_AMOUNT]",
            tone: "replacement",
            findingId: "contract-amount",
          },
          {
            text: ".\nCláusula 8: ",
            tone: "plain",
          },
          {
            text: "[CONFIDENTIAL_CLAUSE]",
            tone: "replacement",
            findingId: "contract-clause",
          },
          {
            text: ".",
            tone: "plain",
          },
        ],
      },
    },
  },
  {
    id: "code",
    label: "Código",
    glyph: "</>",
    fileName: "payments.ts",
    context: "API keys, tokens y connection strings",
    findings: [
      {
        id: "code-api-key",
        label: "API key",
        severity: "critical",
        originalValue: "sk-live-demo_4J7n9Qp2",
        replacement: "[API_KEY]",
      },
      {
        id: "code-token",
        label: "Access token",
        severity: "critical",
        originalValue: "ghp_demo_91Kx8m",
        replacement: "[ACCESS_TOKEN]",
      },
      {
        id: "code-connection",
        label: "Connection string",
        severity: "critical",
        originalValue: "postgres://demo:demo@db.local/billing",
        replacement: "[CONNECTION_STRING]",
      },
    ],
    states: {
      original: {
        label: "Código original",
        status: "3 secretos expuestos en texto plano",
        segments: [
          {
            text: 'const apiKey = "',
            tone: "plain",
          },
          {
            text: "sk-live-demo_4J7n9Qp2",
            tone: "plain",
          },
          {
            text: '";\nconst token = "',
            tone: "plain",
          },
          {
            text: "ghp_demo_91Kx8m",
            tone: "plain",
          },
          {
            text: '";\nconst databaseUrl = "',
            tone: "plain",
          },
          {
            text: "postgres://demo:demo@db.local/billing",
            tone: "plain",
          },
          {
            text: '";',
            tone: "plain",
          },
        ],
      },
      findings: {
        label: "Hallazgos",
        status: "3 secretos críticos señalados",
        segments: [
          {
            text: 'const apiKey = "',
            tone: "plain",
          },
          {
            text: "sk-live-demo_4J7n9Qp2",
            tone: "sensitive",
            findingId: "code-api-key",
          },
          {
            text: '";\nconst token = "',
            tone: "plain",
          },
          {
            text: "ghp_demo_91Kx8m",
            tone: "sensitive",
            findingId: "code-token",
          },
          {
            text: '";\nconst databaseUrl = "',
            tone: "plain",
          },
          {
            text: "postgres://demo:demo@db.local/billing",
            tone: "sensitive",
            findingId: "code-connection",
          },
          {
            text: '";',
            tone: "plain",
          },
        ],
      },
      protected: {
        label: "Versión protegida",
        status: "3 secretos reemplazados localmente",
        segments: [
          {
            text: 'const apiKey = "',
            tone: "plain",
          },
          {
            text: "[API_KEY]",
            tone: "replacement",
            findingId: "code-api-key",
          },
          {
            text: '";\nconst token = "',
            tone: "plain",
          },
          {
            text: "[ACCESS_TOKEN]",
            tone: "replacement",
            findingId: "code-token",
          },
          {
            text: '";\nconst databaseUrl = "',
            tone: "plain",
          },
          {
            text: "[CONNECTION_STRING]",
            tone: "replacement",
            findingId: "code-connection",
          },
          {
            text: '";',
            tone: "plain",
          },
        ],
      },
    },
  },
  {
    id: "commercial-proposal",
    label: "Propuesta comercial",
    glyph: "↗",
    fileName: "propuesta-northstar.txt",
    context: "Cliente, precio, margen y estrategia",
    findings: [
      {
        id: "proposal-client",
        label: "Cliente",
        severity: "medium",
        originalValue: "Northstar Labs",
        replacement: "[CLIENT_NAME]",
      },
      {
        id: "proposal-price",
        label: "Precio comercial",
        severity: "medium",
        originalValue: "USD 96.000",
        replacement: "[CONFIDENTIAL_PRICE]",
      },
      {
        id: "proposal-margin",
        label: "Margen interno",
        severity: "critical",
        originalValue: "42%",
        replacement: "[CONFIDENTIAL_MARGIN]",
      },
      {
        id: "proposal-strategy",
        label: "Estrategia comercial",
        severity: "critical",
        originalValue: "Descuento condicionado a firma antes del 30/09",
        replacement: "[COMMERCIAL_STRATEGY]",
      },
    ],
    states: {
      original: {
        label: "Propuesta original",
        status: "4 datos comerciales todavía visibles",
        segments: [
          {
            text: "PROPUESTA PARA ",
            tone: "plain",
          },
          {
            text: "Northstar Labs",
            tone: "plain",
          },
          {
            text: "\nPrecio anual: ",
            tone: "plain",
          },
          {
            text: "USD 96.000",
            tone: "plain",
          },
          {
            text: "\nMargen interno: ",
            tone: "plain",
          },
          {
            text: "42%",
            tone: "plain",
          },
          {
            text: "\nEstrategia: ",
            tone: "plain",
          },
          {
            text: "Descuento condicionado a firma antes del 30/09",
            tone: "plain",
          },
          {
            text: ".",
            tone: "plain",
          },
        ],
      },
      findings: {
        label: "Hallazgos",
        status: "4 datos comerciales señalados",
        segments: [
          {
            text: "PROPUESTA PARA ",
            tone: "plain",
          },
          {
            text: "Northstar Labs",
            tone: "sensitive",
            findingId: "proposal-client",
          },
          {
            text: "\nPrecio anual: ",
            tone: "plain",
          },
          {
            text: "USD 96.000",
            tone: "sensitive",
            findingId: "proposal-price",
          },
          {
            text: "\nMargen interno: ",
            tone: "plain",
          },
          {
            text: "42%",
            tone: "sensitive",
            findingId: "proposal-margin",
          },
          {
            text: "\nEstrategia: ",
            tone: "plain",
          },
          {
            text: "Descuento condicionado a firma antes del 30/09",
            tone: "sensitive",
            findingId: "proposal-strategy",
          },
          {
            text: ".",
            tone: "plain",
          },
        ],
      },
      protected: {
        label: "Versión protegida",
        status: "4 valores reemplazados localmente",
        segments: [
          {
            text: "PROPUESTA PARA ",
            tone: "plain",
          },
          {
            text: "[CLIENT_NAME]",
            tone: "replacement",
            findingId: "proposal-client",
          },
          {
            text: "\nPrecio anual: ",
            tone: "plain",
          },
          {
            text: "[CONFIDENTIAL_PRICE]",
            tone: "replacement",
            findingId: "proposal-price",
          },
          {
            text: "\nMargen interno: ",
            tone: "plain",
          },
          {
            text: "[CONFIDENTIAL_MARGIN]",
            tone: "replacement",
            findingId: "proposal-margin",
          },
          {
            text: "\nEstrategia: ",
            tone: "plain",
          },
          {
            text: "[COMMERCIAL_STRATEGY]",
            tone: "replacement",
            findingId: "proposal-strategy",
          },
          {
            text: ".",
            tone: "plain",
          },
        ],
      },
    },
  },
  {
    id: "customer-data",
    label: "Datos de cliente",
    glyph: "◎",
    fileName: "ticket-8041.txt",
    context: "Nombres, emails e identificadores",
    findings: [
      {
        id: "customer-name",
        label: "Nombre completo",
        severity: "medium",
        originalValue: "Martina Ríos",
        replacement: "[CONTACT_NAME]",
      },
      {
        id: "customer-email",
        label: "Email",
        severity: "medium",
        originalValue: "martina.rios@example.com",
        replacement: "[CONTACT_EMAIL]",
      },
      {
        id: "customer-id",
        label: "Identificador de cliente",
        severity: "critical",
        originalValue: "CLI-8041-AR",
        replacement: "[CUSTOMER_ID]",
      },
    ],
    states: {
      original: {
        label: "Registro original",
        status: "3 datos personales todavía visibles",
        segments: [
          {
            text: "TICKET DE SOPORTE\nCliente: ",
            tone: "plain",
          },
          {
            text: "Martina Ríos",
            tone: "plain",
          },
          {
            text: "\nEmail: ",
            tone: "plain",
          },
          {
            text: "martina.rios@example.com",
            tone: "plain",
          },
          {
            text: "\nID de cuenta: ",
            tone: "plain",
          },
          {
            text: "CLI-8041-AR",
            tone: "plain",
          },
          {
            text: "\nConsulta: revisar acceso al portal.",
            tone: "plain",
          },
        ],
      },
      findings: {
        label: "Hallazgos",
        status: "3 datos personales señalados",
        segments: [
          {
            text: "TICKET DE SOPORTE\nCliente: ",
            tone: "plain",
          },
          {
            text: "Martina Ríos",
            tone: "sensitive",
            findingId: "customer-name",
          },
          {
            text: "\nEmail: ",
            tone: "plain",
          },
          {
            text: "martina.rios@example.com",
            tone: "sensitive",
            findingId: "customer-email",
          },
          {
            text: "\nID de cuenta: ",
            tone: "plain",
          },
          {
            text: "CLI-8041-AR",
            tone: "sensitive",
            findingId: "customer-id",
          },
          {
            text: "\nConsulta: revisar acceso al portal.",
            tone: "plain",
          },
        ],
      },
      protected: {
        label: "Versión protegida",
        status: "3 valores reemplazados localmente",
        segments: [
          {
            text: "TICKET DE SOPORTE\nCliente: ",
            tone: "plain",
          },
          {
            text: "[CONTACT_NAME]",
            tone: "replacement",
            findingId: "customer-name",
          },
          {
            text: "\nEmail: ",
            tone: "plain",
          },
          {
            text: "[CONTACT_EMAIL]",
            tone: "replacement",
            findingId: "customer-email",
          },
          {
            text: "\nID de cuenta: ",
            tone: "plain",
          },
          {
            text: "[CUSTOMER_ID]",
            tone: "replacement",
            findingId: "customer-id",
          },
          {
            text: "\nConsulta: revisar acceso al portal.",
            tone: "plain",
          },
        ],
      },
    },
  },
] as const satisfies readonly [
  IncidentUseCase,
  IncidentUseCase,
  IncidentUseCase,
  IncidentUseCase,
];
