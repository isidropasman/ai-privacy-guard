// @vitest-environment jsdom

import { afterEach, describe, expect, test, vi } from "vitest";
import { ChatGPTAdapter } from "../../src/adapters/chatgpt/ChatGPTAdapter";
import { SubmissionInterceptor } from "../../src/interception/SubmissionInterceptor";

type ReviewResult =
  | { kind: "allow"; replacementText?: string }
  | { kind: "interrupt" }
  | { kind: "error"; originalMayBeSent: boolean };

function renderComposer(text = "safe prompt") {
  document.body.innerHTML = `
    <main>
      <form id="composer-form">
        <textarea id="prompt-textarea">${text}</textarea>
        <button data-testid="send-button" type="submit">Send</button>
      </form>
    </main>
  `;
}

function setupInterceptor(
  review: (text: string) => Promise<ReviewResult> = async () => ({
    kind: "allow",
  }),
) {
  const submitted = vi.fn((event: Event) => event.preventDefault());
  const interrupted = vi.fn();
  const failed = vi.fn();
  const reviewFailed = vi.fn(
    async (_originalMayBeSent: boolean): Promise<"allow" | "interrupt"> =>
      "interrupt",
  );
  document.addEventListener("submit", submitted);

  const interceptor = new SubmissionInterceptor({
    root: document,
    adapter: new ChatGPTAdapter(document),
    review,
    onInterrupted: interrupted,
    onReviewError: reviewFailed,
    onError: failed,
  });
  const stop = interceptor.start();

  return {
    interceptor,
    submitted,
    interrupted,
    failed,
    reviewFailed,
    stop: () => {
      stop();
      document.removeEventListener("submit", submitted);
    },
  };
}

async function flushSubmission() {
  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));
}

afterEach(() => {
  document.body.replaceChildren();
});

describe("SubmissionInterceptor", () => {
  test.each([
    ["Enter", {}],
    ["Ctrl+Enter", { ctrlKey: true }],
    ["Cmd+Enter", { metaKey: true }],
  ])("allows %s through one approved submission", async (_label, modifiers) => {
    renderComposer();
    const review = vi.fn(async () => ({ kind: "allow" as const }));
    const harness = setupInterceptor(review);
    const composer = document.querySelector("textarea");
    const event = new KeyboardEvent("keydown", {
      key: "Enter",
      bubbles: true,
      cancelable: true,
      ...modifiers,
    });

    composer?.dispatchEvent(event);
    await flushSubmission();

    expect(event.defaultPrevented).toBe(true);
    expect(review).toHaveBeenCalledOnce();
    expect(review).toHaveBeenCalledWith("safe prompt");
    expect(harness.submitted).toHaveBeenCalledOnce();
    harness.stop();
  });

  test("does not intercept Shift+Enter", async () => {
    renderComposer();
    const review = vi.fn(async () => ({ kind: "allow" as const }));
    const harness = setupInterceptor(review);
    const event = new KeyboardEvent("keydown", {
      key: "Enter",
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    });

    document.querySelector("textarea")?.dispatchEvent(event);
    await flushSubmission();

    expect(event.defaultPrevented).toBe(false);
    expect(review).not.toHaveBeenCalled();
    expect(harness.submitted).not.toHaveBeenCalled();
    harness.stop();
  });

  test("allows a send-button click through one approved submission", async () => {
    renderComposer();
    const review = vi.fn(async () => ({ kind: "allow" as const }));
    const harness = setupInterceptor(review);
    const event = new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
    });

    document.querySelector("button")?.dispatchEvent(event);
    await flushSubmission();

    expect(event.defaultPrevented).toBe(true);
    expect(review).toHaveBeenCalledOnce();
    expect(harness.submitted).toHaveBeenCalledOnce();
    harness.stop();
  });

  test("blocks duplicate clicks while the first review is in flight", async () => {
    renderComposer();
    let resolveReview: ((value: ReviewResult) => void) | undefined;
    const review = vi.fn(
      () =>
        new Promise<ReviewResult>((resolve) => {
          resolveReview = resolve;
        }),
    );
    const harness = setupInterceptor(review);
    const button = document.querySelector("button");

    button?.dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true }),
    );
    button?.dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true }),
    );
    resolveReview?.({ kind: "allow" });
    await flushSubmission();

    expect(review).toHaveBeenCalledOnce();
    expect(harness.submitted).toHaveBeenCalledOnce();
    harness.stop();
  });

  test("does not register duplicate listeners when started twice", async () => {
    renderComposer();
    const review = vi.fn(async () => ({ kind: "allow" as const }));
    const harness = setupInterceptor(review);

    harness.interceptor.start();
    document
      .querySelector("button")
      ?.dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true }),
      );
    await flushSubmission();

    expect(review).toHaveBeenCalledOnce();
    expect(harness.submitted).toHaveBeenCalledOnce();
    harness.stop();
  });

  test("allows a direct form submit through one approved submission", async () => {
    renderComposer();
    const review = vi.fn(async () => ({ kind: "allow" as const }));
    const harness = setupInterceptor(review);
    const form = document.querySelector("form");
    const event = new SubmitEvent("submit", {
      bubbles: true,
      cancelable: true,
    });

    form?.dispatchEvent(event);
    await flushSubmission();

    expect(event.defaultPrevented).toBe(true);
    expect(review).toHaveBeenCalledOnce();
    expect(harness.submitted).toHaveBeenCalledOnce();
    harness.stop();
  });

  test("interrupts submission without changing the composer", async () => {
    renderComposer("critical fixture");
    const harness = setupInterceptor(async () => ({ kind: "interrupt" }));
    const event = new KeyboardEvent("keydown", {
      key: "Enter",
      bubbles: true,
      cancelable: true,
    });

    document.querySelector("textarea")?.dispatchEvent(event);
    await flushSubmission();

    expect(event.defaultPrevented).toBe(true);
    expect(harness.interrupted).toHaveBeenCalledOnce();
    expect(harness.submitted).not.toHaveBeenCalled();
    expect(document.querySelector("textarea")?.value).toBe("critical fixture");
    harness.stop();
  });

  test("applies approved redaction before the single submission", async () => {
    renderComposer("juan@example.com");
    const harness = setupInterceptor(async () => ({
      kind: "allow",
      replacementText: "[EMAIL_CONTACT]",
    }));

    document
      .querySelector("button")
      ?.dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true }),
      );
    await flushSubmission();

    expect(document.querySelector("textarea")?.value).toBe("[EMAIL_CONTACT]");
    expect(harness.submitted).toHaveBeenCalledOnce();
    harness.stop();
  });

  test("keeps content blocked and reports an unexpected review error", async () => {
    renderComposer("unchanged");
    const failure = new Error("review failed");
    const harness = setupInterceptor(async () => Promise.reject(failure));

    document
      .querySelector("button")
      ?.dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true }),
      );
    await flushSubmission();

    expect(harness.failed).toHaveBeenCalledWith(failure);
    expect(harness.submitted).not.toHaveBeenCalled();
    expect(document.querySelector("textarea")?.value).toBe("unchanged");
    harness.stop();
  });

  test("lets the user approve an original only when review marks it safe to offer", async () => {
    renderComposer("unchanged");
    const harness = setupInterceptor(async () => ({
      kind: "error",
      originalMayBeSent: true,
    }));
    harness.reviewFailed.mockResolvedValue("allow");

    document
      .querySelector("button")
      ?.dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true }),
      );
    await flushSubmission();

    expect(harness.reviewFailed).toHaveBeenCalledWith(true);
    expect(harness.submitted).toHaveBeenCalledOnce();
    harness.stop();
  });

  test("never resumes a review error after a critical finding", async () => {
    renderComposer("critical fixture");
    const harness = setupInterceptor(async () => ({
      kind: "error",
      originalMayBeSent: false,
    }));
    harness.reviewFailed.mockResolvedValue("allow");

    document
      .querySelector("button")
      ?.dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true }),
      );
    await flushSubmission();

    expect(harness.reviewFailed).toHaveBeenCalledWith(false);
    expect(harness.submitted).not.toHaveBeenCalled();
    harness.stop();
  });

  test("uses the recreated composer and still submits exactly once", async () => {
    renderComposer("old");
    const review = vi.fn(async () => ({ kind: "allow" as const }));
    const harness = setupInterceptor(review);

    renderComposer("new");
    document
      .querySelector("button")
      ?.dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true }),
      );
    await flushSubmission();

    expect(review).toHaveBeenCalledWith("new");
    expect(review).toHaveBeenCalledOnce();
    expect(harness.submitted).toHaveBeenCalledOnce();
    harness.stop();
  });
});
