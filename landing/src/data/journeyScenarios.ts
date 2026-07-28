export type JourneyMode = "without-redacta" | "with-redacta";

export type JourneyPhase =
  | "idle"
  | "employee"
  | "boundary"
  | "provider"
  | "persistence"
  | "response"
  | "complete";

export interface JourneyScenario {
  readonly mode: JourneyMode;
  readonly label: string;
  readonly input: string;
  readonly outboundPayload: string;
  readonly storagePayload: string;
  readonly phaseMessages: Readonly<Record<JourneyPhase, string>>;
}

export const journeyScenarios = {
  "without-redacta": {
    mode: "without-redacta",
    label: "Sin Redacta",
    input:
      "Resumí la propuesta para Grupo Andino. Margen: 38,4%. Contacto: maria@grupoandino.com",
    outboundPayload:
      "Grupo Andino · margen 38,4% · maria@grupoandino.com",
    storagePayload:
      "Grupo Andino · margen 38,4% · maria@grupoandino.com",
    phaseMessages: {
      idle: "Elegí iniciar para seguir el dato sensible.",
      employee: "El empleado prepara un prompt con datos reales.",
      boundary: "El navegador envía el contenido original sin inspeccionarlo.",
      provider: "El proveedor recibe nombres, margen y correo reales.",
      persistence: "Una copia queda sujeta a la retención del proveedor.",
      response: "La respuesta vuelve, pero el dato original ya salió.",
      complete: "El prompt sensible quedó persistido fuera de tu control.",
    },
  },
  "with-redacta": {
    mode: "with-redacta",
    label: "Con Redacta",
    input:
      "Resumí la propuesta para Grupo Andino. Margen: 38,4%. Contacto: maria@grupoandino.com",
    outboundPayload:
      "[CLIENT_NAME] · [CONFIDENTIAL_MARGIN] · [CONTACT_EMAIL]",
    storagePayload:
      "[CLIENT_NAME] · [CONFIDENTIAL_MARGIN] · [CONTACT_EMAIL]",
    phaseMessages: {
      idle: "Elegí iniciar para seguir la protección local.",
      employee: "El empleado prepara el mismo prompt sensible.",
      boundary: "Redacta detecta y anonimiza el contenido en este navegador.",
      provider: "El proveedor recibe únicamente etiquetas anónimas.",
      persistence: "Si el proveedor retiene una copia, ya está anonimizada.",
      response: "La respuesta vuelve sin exponer la identidad original.",
      complete: "El proveedor solo recibió datos anonimizados.",
    },
  },
} as const satisfies Record<JourneyMode, JourneyScenario>;
