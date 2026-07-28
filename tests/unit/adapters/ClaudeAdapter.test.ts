// @vitest-environment jsdom

import { afterEach, describe, expect, test } from "vitest";
import { ClaudeAdapter } from "../../../src/adapters/claude/ClaudeAdapter";

function createAdapter() {
  return new ClaudeAdapter(document);
}

function locationFrom(url: string): Location {
  return new URL(url) as unknown as Location;
}

afterEach(() => {
  document.body.replaceChildren();
});

describe("ClaudeAdapter", () => {
  test("matches only claude.ai", () => {
    const adapter = createAdapter();

    expect(
      adapter.matchesLocation(locationFrom("https://claude.ai/new")),
    ).toBe(true);
    expect(adapter.matchesLocation(locationFrom("https://example.com/"))).toBe(
      false,
    );
  });

  test("finds the ProseMirror-style composer", () => {
    document.body.innerHTML = `
      <fieldset>
        <div role="textbox" contenteditable="true" aria-label="Write your prompt to Claude"></div>
      </fieldset>
    `;

    expect(createAdapter().findComposer()).not.toBeNull();
  });

  test("recognizes the send button by aria-label", () => {
    document.body.innerHTML =
      '<button aria-label="Send Message" type="button"><span>Send</span></button>';
    const child = document.querySelector("span");
    const event = new MouseEvent("click", { bubbles: true });
    child?.dispatchEvent(event);

    expect(createAdapter().isSendAction(event)).toBe(true);
  });
});
