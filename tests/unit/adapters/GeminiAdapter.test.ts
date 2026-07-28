// @vitest-environment jsdom

import { afterEach, describe, expect, test } from "vitest";
import { GeminiAdapter } from "../../../src/adapters/gemini/GeminiAdapter";

function createAdapter() {
  return new GeminiAdapter(document);
}

function locationFrom(url: string): Location {
  return new URL(url) as unknown as Location;
}

afterEach(() => {
  document.body.replaceChildren();
});

describe("GeminiAdapter", () => {
  test("matches only gemini.google.com", () => {
    const adapter = createAdapter();

    expect(
      adapter.matchesLocation(locationFrom("https://gemini.google.com/app")),
    ).toBe(true);
    expect(adapter.matchesLocation(locationFrom("https://example.com/"))).toBe(
      false,
    );
  });

  test("finds the Quill-based composer", () => {
    document.body.innerHTML = `
      <rich-textarea>
        <div class="ql-editor" role="textbox" contenteditable="true" aria-label="Enter a prompt for Gemini"></div>
      </rich-textarea>
    `;

    expect(createAdapter().findComposer()).not.toBeNull();
  });

  test("recognizes the send button by aria-label", () => {
    document.body.innerHTML =
      '<button aria-label="Send message" type="button"><span>Send</span></button>';
    const child = document.querySelector("span");
    const event = new MouseEvent("click", { bubbles: true });
    child?.dispatchEvent(event);

    expect(createAdapter().isSendAction(event)).toBe(true);
  });
});
