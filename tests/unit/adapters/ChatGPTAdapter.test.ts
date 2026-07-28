// @vitest-environment jsdom

import { afterEach, describe, expect, test, vi } from "vitest";
import { ChatGPTAdapter } from "../../../src/adapters/chatgpt/ChatGPTAdapter";

function createAdapter() {
  return new ChatGPTAdapter(document);
}

function locationFrom(url: string): Location {
  return new URL(url) as unknown as Location;
}

afterEach(() => {
  document.body.replaceChildren();
});

describe("ChatGPTAdapter", () => {
  test("matches only supported ChatGPT locations", () => {
    const adapter = createAdapter();

    expect(adapter.matchesLocation(locationFrom("https://chatgpt.com/"))).toBe(
      true,
    );
    expect(
      adapter.matchesLocation(
        locationFrom("https://chat.openai.com/c/example"),
      ),
    ).toBe(true);
    expect(adapter.matchesLocation(locationFrom("https://example.com/"))).toBe(
      false,
    );
  });

  test("prioritizes the semantic textbox composer", () => {
    document.body.innerHTML = `
      <textarea id="fallback">fallback</textarea>
      <div id="semantic" role="textbox" contenteditable="true">semantic</div>
    `;

    expect(createAdapter().findComposer()?.id).toBe("semantic");
  });

  test("falls back to a textarea near the send form", () => {
    document.body.innerHTML = `
      <form>
        <textarea id="prompt-textarea">hello</textarea>
        <button data-testid="send-button" type="button">Send</button>
      </form>
    `;

    const adapter = createAdapter();

    expect(adapter.findComposer()?.id).toBe("prompt-textarea");
    expect(adapter.getComposerText()).toBe("hello");
  });

  test("prefers a composer sharing a form with the send button", () => {
    document.body.innerHTML = `
      <textarea id="unrelated">notes</textarea>
      <form>
        <textarea id="composer">hello</textarea>
        <button data-testid="send-button" type="button">Send</button>
      </form>
    `;

    expect(createAdapter().findComposer()?.id).toBe("composer");
  });

  test("updates a contenteditable composer without using HTML", () => {
    document.body.innerHTML =
      '<div role="textbox" contenteditable="true">original</div>';

    const adapter = createAdapter();
    adapter.setComposerText("<safe> & text");

    expect(adapter.getComposerText()).toBe("<safe> & text");
    expect(adapter.findComposer()?.innerHTML).toBe("&lt;safe&gt; &amp; text");
  });

  test("updates a controlled textarea through its native value setter", () => {
    document.body.innerHTML =
      '<textarea id="prompt-textarea">original</textarea>';
    const textarea = document.querySelector("textarea");
    const valueDescriptor = Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      "value",
    );

    expect(textarea).not.toBeNull();
    expect(valueDescriptor?.get).toBeTypeOf("function");
    expect(valueDescriptor?.set).toBeTypeOf("function");
    if (
      textarea === null ||
      valueDescriptor?.get === undefined ||
      valueDescriptor.set === undefined
    ) {
      return;
    }

    const getValue = valueDescriptor.get.bind(textarea);
    const setValue = valueDescriptor.set.bind(textarea);
    let trackedValue = textarea.value;
    let controlledState = textarea.value;
    const getNativeValue = (): string => {
      const value: unknown = getValue();
      return typeof value === "string" ? value : "";
    };
    Object.defineProperty(textarea, "value", {
      configurable: true,
      get: getNativeValue,
      set: (value: string) => {
        setValue(value);
        trackedValue = value;
      },
    });
    textarea.addEventListener("input", () => {
      const domValue = getNativeValue();
      if (domValue !== trackedValue) {
        controlledState = domValue;
        trackedValue = domValue;
      }
    });

    createAdapter().setComposerText("[EMAIL_CONTACT]");

    expect(controlledState).toBe("[EMAIL_CONTACT]");
  });

  test("clicks the current send button once for an approved submission", async () => {
    document.body.innerHTML = `
      <form>
        <textarea>hello</textarea>
        <button data-testid="send-button" type="button">Send</button>
      </form>
    `;
    const button = document.querySelector("button");
    const click = vi.spyOn(button as HTMLButtonElement, "click");

    await createAdapter().triggerApprovedSubmission();

    expect(click).toHaveBeenCalledOnce();
  });

  test("recognizes send keyboard shortcuts but not Shift+Enter", () => {
    const adapter = createAdapter();

    expect(
      adapter.isSendAction(new KeyboardEvent("keydown", { key: "Enter" })),
    ).toBe(true);
    expect(
      adapter.isSendAction(
        new KeyboardEvent("keydown", { key: "Enter", shiftKey: true }),
      ),
    ).toBe(false);
  });

  test("recognizes an event originating from the send button", () => {
    document.body.innerHTML =
      '<button data-testid="send-button" type="button"><span>Send</span></button>';
    const child = document.querySelector("span");
    const event = new MouseEvent("click", { bubbles: true });
    child?.dispatchEvent(event);

    expect(createAdapter().isSendAction(event)).toBe(true);
  });

  test("reports composer replacement once and stops after unsubscribe", async () => {
    document.body.innerHTML =
      '<main><div role="textbox" contenteditable="true">first</div></main>';
    const callback = vi.fn();
    const unsubscribe = createAdapter().observeComposerChanges(callback);

    document.querySelector('[role="textbox"]')?.replaceWith(
      Object.assign(document.createElement("textarea"), {
        value: "second",
      }),
    );
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(callback).toHaveBeenCalledOnce();

    unsubscribe();
    document.querySelector("textarea")?.remove();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(callback).toHaveBeenCalledOnce();
  });
});
