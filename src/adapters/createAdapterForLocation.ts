import { ChatGPTAdapter } from "./chatgpt/ChatGPTAdapter";
import { ClaudeAdapter } from "./claude/ClaudeAdapter";
import { GeminiAdapter } from "./gemini/GeminiAdapter";
import type { ProviderAdapter } from "./types";

const adapterFactories = [
  (document: Document) => new ChatGPTAdapter(document),
  (document: Document) => new ClaudeAdapter(document),
  (document: Document) => new GeminiAdapter(document),
];

export function createAdapterForLocation(
  document: Document,
  location: Location,
): ProviderAdapter | null {
  for (const createAdapter of adapterFactories) {
    const adapter = createAdapter(document);
    if (adapter.matchesLocation(location)) {
      return adapter;
    }
  }

  return null;
}
