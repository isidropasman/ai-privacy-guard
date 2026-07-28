export interface Provider {
  readonly id: string;
  readonly name: string;
  readonly logo: string;
  readonly detail: string;
}

export const providers = [
  {
    id: "chatgpt",
    name: "ChatGPT",
    logo: "/providers/openai.webp",
    detail: "chatgpt.com · chat.openai.com",
  },
  {
    id: "claude",
    name: "Claude",
    logo: "/providers/claude.webp",
    detail: "claude.ai",
  },
  {
    id: "gemini",
    name: "Gemini",
    logo: "/providers/gemini.webp",
    detail: "gemini.google.com",
  },
] as const satisfies readonly [Provider, Provider, Provider];
