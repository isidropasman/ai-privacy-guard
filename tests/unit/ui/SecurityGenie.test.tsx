// @vitest-environment jsdom

import { createRef } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, test, vi } from "vitest";
import type { DetectionFinding } from "../../../src/detection/types";
import { SecurityGenie } from "../../../src/ui/mascot/SecurityGenie";
import {
  SecurityGenieController,
  type SecurityGenieHandle,
} from "../../../src/ui/mascot/SecurityGenieController";

const emailFinding: DetectionFinding = {
  id: "email-1",
  detectorId: "email",
  category: "email",
  severity: "medium",
  confidence: 0.98,
  start: 0,
  end: 16,
  safePreview: "j•••@example.com",
  explanation: "El texto incluye un email de contacto.",
  suggestedReplacement: "[EMAIL_CONTACT]",
};

async function settleRender() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

async function renderGenie(
  element: React.ReactElement,
): Promise<{ readonly shadow: ShadowRoot; readonly root: Root }> {
  const host = document.createElement("div");
  document.body.append(host);
  const shadow = host.attachShadow({ mode: "open" });
  const container = document.createElement("div");
  shadow.append(container);
  const root = createRoot(container);
  root.render(element);
  await settleRender();
  return { shadow, root };
}

afterEach(() => {
  document.body.replaceChildren();
});

describe("SecurityGenie", () => {
  test("stays compact while idle and exposes its explanation", async () => {
    const harness = await renderGenie(
      <SecurityGenie
        state={{ kind: "idle" }}
        decision={null}
        onDecision={vi.fn()}
        onDismissStatus={vi.fn()}
      />,
    );

    expect(
      harness.shadow.querySelector('[data-mascot-state="idle"]'),
    ).not.toBeNull();
    expect(harness.shadow.querySelector('[role="dialog"]')).toBeNull();
    expect(
      harness.shadow.querySelector('[role="img"][aria-label="Security Genie"]'),
    ).not.toBeNull();
    expect(
      harness.shadow
        .querySelector("[data-mascot-sprite]")
        ?.classList.contains("security-genie__sprite--idle"),
    ).toBe(true);

    harness.shadow
      .querySelector<HTMLButtonElement>(
        '[aria-label="¿Qué hace Security Genie?"]',
      )
      ?.click();
    await settleRender();

    const explanation = harness.shadow.querySelector(
      '[data-surface="genie-info"]',
    );
    expect(explanation?.textContent).toContain("¿Por qué estoy acá?");
    expect(explanation?.textContent).toContain("Analizo localmente");
    expect(explanation?.textContent).toContain(
      "Bloqueo secretos y credenciales",
    );
    expect(explanation?.textContent).toContain(
      "Anonimizo datos personales",
    );
    harness.root.unmount();
  });

  test("closes the explanation with Escape or a second mascot click", async () => {
    const harness = await renderGenie(
      <SecurityGenie
        state={{ kind: "idle" }}
        decision={null}
        onDecision={vi.fn()}
        onDismissStatus={vi.fn()}
      />,
    );
    const trigger = harness.shadow.querySelector<HTMLButtonElement>(
      '[aria-label="¿Qué hace Security Genie?"]',
    );
    expect(trigger).not.toBeNull();

    trigger?.click();
    await settleRender();
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    await settleRender();
    expect(
      harness.shadow.querySelector('[data-surface="genie-info"]'),
    ).toBeNull();

    trigger?.click();
    await settleRender();
    trigger?.click();
    await settleRender();
    expect(
      harness.shadow.querySelector('[data-surface="genie-info"]'),
    ).toBeNull();
    harness.root.unmount();
  });

  test("keeps the explanation unavailable during a privacy decision", async () => {
    const harness = await renderGenie(
      <SecurityGenie
        state={{
          kind: "verify",
          message: "Encontré información sensible. Revisala antes de seguir.",
        }}
        decision={{
          decision: "WARN",
          score: 35,
          findings: [emailFinding],
          redactedText: "[EMAIL_CONTACT]",
        }}
        onDecision={vi.fn()}
        onDismissStatus={vi.fn()}
      />,
    );

    expect(
      harness.shadow.querySelector(
        '[aria-label="¿Qué hace Security Genie?"]',
      ),
    ).toBeNull();
    expect(
      harness.shadow.querySelector('[data-surface="genie-info"]'),
    ).toBeNull();
    harness.root.unmount();
  });

  test("shows a status bubble for a clean result", async () => {
    const dismiss = vi.fn();
    const harness = await renderGenie(
      <SecurityGenie
        state={{ kind: "allow", message: "Todo limpio. Podés enviarlo." }}
        decision={null}
        onDecision={vi.fn()}
        onDismissStatus={dismiss}
      />,
    );

    expect(
      harness.shadow.querySelector('[role="status"] span')?.textContent,
    ).toBe("Todo limpio. Podés enviarlo.");
    harness.shadow
      .querySelector<HTMLButtonElement>('[aria-label="Cerrar mensaje"]')
      ?.click();
    expect(dismiss).toHaveBeenCalledOnce();
    harness.root.unmount();
  });

  test("anchors warning decisions to the mascot and resolves the action", async () => {
    const decide = vi.fn();
    const harness = await renderGenie(
      <SecurityGenie
        state={{
          kind: "verify",
          message: "Encontré información sensible. Revisala antes de seguir.",
        }}
        decision={{
          decision: "WARN",
          score: 35,
          findings: [emailFinding],
          redactedText: "Contactá a [EMAIL_CONTACT].",
        }}
        onDecision={decide}
        onDismissStatus={vi.fn()}
      />,
    );

    expect(
      harness.shadow.querySelector('[data-surface="genie-bubble"]'),
    ).not.toBeNull();
    expect(
      harness.shadow.querySelector('[role="dialog"]')?.textContent,
    ).toContain("Encontré datos sensibles");
    harness.shadow
      .querySelector<HTMLButtonElement>('[data-action="redact"]')
      ?.click();
    expect(decide).toHaveBeenCalledWith("redact");
    harness.root.unmount();
  });

  test("Escape returns safely to the message", async () => {
    const composer = document.createElement("textarea");
    document.body.append(composer);
    composer.focus();
    const decide = vi.fn();
    const harness = await renderGenie(
      <SecurityGenie
        state={{
          kind: "verify",
          message: "Encontré información sensible. Revisala antes de seguir.",
        }}
        decision={{
          decision: "WARN",
          score: 35,
          findings: [emailFinding],
          redactedText: "[EMAIL_CONTACT]",
        }}
        onDecision={decide}
        onDismissStatus={vi.fn()}
        returnFocus={composer}
      />,
    );

    harness.shadow
      .querySelector('[role="dialog"]')
      ?.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
      );
    harness.root.render(
      <SecurityGenie
        state={{ kind: "idle" }}
        decision={null}
        onDecision={decide}
        onDismissStatus={vi.fn()}
      />,
    );
    await settleRender();

    expect(decide).toHaveBeenCalledWith("cancel");
    harness.root.unmount();
  });
});

describe("SecurityGenieController", () => {
  test("presents one decision and resolves it from the anchored bubble", async () => {
    const controllerRef = createRef<SecurityGenieHandle>();
    const harness = await renderGenie(
      <SecurityGenieController ref={controllerRef} />,
    );
    const composer = document.createElement("textarea");
    document.body.append(composer);
    composer.focus();

    const decision = controllerRef.current?.requestDecision({
      decision: "WARN",
      score: 35,
      findings: [emailFinding],
      redactedText: "[EMAIL_CONTACT]",
    });
    await settleRender();

    expect(
      harness.shadow.querySelector('[data-mascot-state="verify"]'),
    ).not.toBeNull();
    harness.shadow
      .querySelector<HTMLButtonElement>('[data-action="redact"]')
      ?.click();

    await expect(decision).resolves.toBe("redact");
    await settleRender();
    expect(harness.shadow.querySelector('[role="dialog"]')).toBeNull();
    expect(document.activeElement).toBe(composer);
    harness.root.unmount();
  });

  test("maps lifecycle events to visible mascot states", async () => {
    const controllerRef = createRef<SecurityGenieHandle>();
    const harness = await renderGenie(
      <SecurityGenieController ref={controllerRef} />,
    );

    controllerRef.current?.emit({ kind: "review-started" });
    await settleRender();
    expect(
      harness.shadow.querySelector('[data-mascot-state="scanning"]'),
    ).not.toBeNull();

    controllerRef.current?.emit({ kind: "allowed" });
    await settleRender();
    expect(
      harness.shadow.querySelector('[data-mascot-state="allow"]'),
    ).not.toBeNull();
    harness.root.unmount();
  });
});
