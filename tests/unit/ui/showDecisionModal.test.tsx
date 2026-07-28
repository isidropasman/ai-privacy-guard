// @vitest-environment jsdom

import { afterEach, describe, expect, test } from "vitest";
import { showDecisionModal } from "../../../src/ui/showDecisionModal";
import { showTechnicalErrorModal } from "../../../src/ui/showTechnicalErrorModal";
import type { DetectionFinding } from "../../../src/detection/types";

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

function createShadowRoot(): ShadowRoot {
  const host = document.createElement("div");
  document.body.append(host);
  return host.attachShadow({ mode: "open" });
}

async function settleRender() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

afterEach(() => {
  document.body.replaceChildren();
});

describe("showDecisionModal", () => {
  test("offers anonymize and original-send actions for warnings", async () => {
    const shadow = createShadowRoot();
    const decision = showDecisionModal(shadow, {
      decision: "WARN",
      score: 35,
      findings: [emailFinding],
      redactedText: "Contactá a [EMAIL_CONTACT].",
    });
    await settleRender();

    expect(shadow.querySelector('[role="dialog"]')).not.toBeNull();
    expect(shadow.textContent).toContain("Encontramos información sensible");
    expect(shadow.textContent).toContain("Enviar original");
    const primary = shadow.querySelector<HTMLButtonElement>(
      '[data-action="redact"]',
    );
    primary?.click();

    await expect(decision).resolves.toBe("redact");
    expect(shadow.querySelector('[role="dialog"]')).toBeNull();
  });

  test("does not offer original send for strict critical blocks", async () => {
    const shadow = createShadowRoot();
    const decision = showDecisionModal(shadow, {
      decision: "BLOCK",
      score: 100,
      findings: [
        {
          ...emailFinding,
          category: "credential",
          severity: "critical",
          safePreview: "Credencial oculta",
        },
      ],
      redactedText: "API_KEY=[API_KEY_REMOVED]",
      allowCriticalOverride: false,
    });
    await settleRender();

    expect(shadow.textContent).toContain("Envío bloqueado");
    expect(shadow.textContent).not.toContain("Enviar original");
    shadow.querySelector<HTMLButtonElement>('[data-action="review"]')?.click();

    await expect(decision).resolves.toBe("review");
  });

  test("Escape returns safely to the message and restores focus", async () => {
    const previous = document.createElement("button");
    document.body.append(previous);
    previous.focus();
    const shadow = createShadowRoot();
    const decision = showDecisionModal(shadow, {
      decision: "WARN",
      score: 20,
      findings: [emailFinding],
      redactedText: "[EMAIL_CONTACT]",
    });
    await settleRender();

    shadow
      .querySelector('[role="dialog"]')
      ?.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
      );

    await expect(decision).resolves.toBe("cancel");
    expect(document.activeElement).toBe(previous);
  });

  test("technical errors expose original send only when explicitly allowed", async () => {
    const shadow = createShadowRoot();
    const decision = showTechnicalErrorModal(shadow, false);
    await settleRender();

    expect(shadow.textContent).toContain("No pudimos verificar este envío");
    expect(shadow.textContent).not.toContain("Enviar original");
    shadow.querySelector<HTMLButtonElement>('[data-action="review"]')?.click();

    await expect(decision).resolves.toBe("review");
  });
});
