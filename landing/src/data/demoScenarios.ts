export type DemoState =
  | "idle"
  | "scanning"
  | "risk-detected"
  | "redacting"
  | "protected"
  | "sent";

export interface DemoFinding {
  readonly label: string;
  readonly severity: "medium" | "critical";
  readonly originalValue: string;
  readonly replacement: string;
}

export interface DemoScenario {
  readonly id: string;
  readonly label: string;
  readonly originalText: string;
  readonly protectedText: string;
  readonly findings: readonly DemoFinding[];
}

export const demoScenarios = [
  {
    id: "credential",
    label: "Credencial",
    originalText:
      "Revisá este código:\n\nOPENAI_API_KEY=sk-proj-demo-example-123456",
    protectedText: "Revisá este código:\n\nOPENAI_API_KEY=[API_KEY_REMOVED]",
    findings: [
      {
        label: "Credencial de API",
        severity: "critical",
        originalValue: "sk-proj-demo-example-123456",
        replacement: "[API_KEY_REMOVED]",
      },
    ],
  },
  {
    id: "customer",
    label: "Datos de cliente",
    originalText:
      "Ayudame a escribirle a Juan Pérez.\nSu email es juan.perez@example.com.",
    protectedText:
      "Ayudame a escribirle a [CONTACT_NAME].\nSu email es [EMAIL_CONTACT].",
    findings: [
      {
        label: "Nombre de contacto",
        severity: "medium",
        originalValue: "Juan Pérez",
        replacement: "[CONTACT_NAME]",
      },
      {
        label: "Email personal",
        severity: "medium",
        originalValue: "juan.perez@example.com",
        replacement: "[EMAIL_CONTACT]",
      },
    ],
  },
  {
    id: "commercial",
    label: "Info comercial",
    originalText:
      "Analizá esta propuesta para Cliente ACME.\nPrecio: USD 120.000.\nMargen interno: 47%.",
    protectedText:
      "Analizá esta propuesta para [CLIENT_NAME].\nPrecio: [CONFIDENTIAL_AMOUNT].\nMargen interno: [CONFIDENTIAL_MARGIN].",
    findings: [
      {
        label: "Cliente confidencial",
        severity: "medium",
        originalValue: "Cliente ACME",
        replacement: "[CLIENT_NAME]",
      },
      {
        label: "Precio comercial",
        severity: "medium",
        originalValue: "USD 120.000",
        replacement: "[CONFIDENTIAL_AMOUNT]",
      },
      {
        label: "Margen interno",
        severity: "medium",
        originalValue: "47%",
        replacement: "[CONFIDENTIAL_MARGIN]",
      },
    ],
  },
] as const satisfies readonly [DemoScenario, ...DemoScenario[]];
