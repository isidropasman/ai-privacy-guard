// @vitest-environment jsdom

import { describe, expect, test } from "vitest";
import { ChatGPTAdapter } from "../../../src/adapters/chatgpt/ChatGPTAdapter";
import { ClaudeAdapter } from "../../../src/adapters/claude/ClaudeAdapter";
import { createAdapterForLocation } from "../../../src/adapters/createAdapterForLocation";
import { GeminiAdapter } from "../../../src/adapters/gemini/GeminiAdapter";

function locationFrom(url: string): Location {
  return new URL(url) as unknown as Location;
}

describe("createAdapterForLocation", () => {
  test("picks the adapter matching the current hostname", () => {
    expect(
      createAdapterForLocation(document, locationFrom("https://chatgpt.com/")),
    ).toBeInstanceOf(ChatGPTAdapter);
    expect(
      createAdapterForLocation(document, locationFrom("https://claude.ai/new")),
    ).toBeInstanceOf(ClaudeAdapter);
    expect(
      createAdapterForLocation(
        document,
        locationFrom("https://gemini.google.com/app"),
      ),
    ).toBeInstanceOf(GeminiAdapter);
  });

  test("returns null for unsupported hosts", () => {
    expect(
      createAdapterForLocation(document, locationFrom("https://example.com/")),
    ).toBeNull();
  });
});
