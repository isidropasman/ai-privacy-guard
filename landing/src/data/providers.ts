export type ProviderStatus = "available" | "planned";

export interface Provider {
  readonly id: string;
  readonly name: string;
  readonly logo: string;
  readonly status: ProviderStatus;
  readonly detail: string;
}

export const providerStatusLabel: Readonly<Record<ProviderStatus, string>> = {
  available: "Disponible hoy",
  planned: "Próximamente",
};

export const providers = [
  {
    id: "chatgpt",
    name: "ChatGPT",
    logo: "/providers/openai.webp",
    status: "available",
    detail: "chatgpt.com · chat.openai.com",
  },
  {
    id: "claude",
    name: "Claude",
    logo: "/providers/claude.webp",
    status: "planned",
    detail: "En evaluación",
  },
  {
    id: "gemini",
    name: "Gemini",
    logo: "/providers/gemini.webp",
    status: "planned",
    detail: "En evaluación",
  },
] as const satisfies readonly [Provider, Provider, Provider];
