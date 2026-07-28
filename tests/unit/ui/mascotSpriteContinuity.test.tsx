// @vitest-environment jsdom

import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, test, vi } from "vitest";
import type { DecisionModalInput } from "../../../src/ui/showDecisionModal";
import { SecurityGenie } from "../../../src/ui/mascot/SecurityGenie";

const decision: DecisionModalInput = {
  decision: "WARN",
  score: 40,
  findings: [],
  redactedText: "hola",
  originalMayBeSent: true,
};

afterEach(() => {
  document.body.replaceChildren();
});

test("the mascot sprite node survives a decision opening and closing", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);

  const render = async (input: DecisionModalInput | null) => {
    await act(async () => {
      root.render(
        <SecurityGenie
          state={{ kind: "idle" }}
          decision={input}
          onDecision={vi.fn()}
          onDismissStatus={vi.fn()}
        />,
      );
    });
  };

  await render(null);
  const idle = host.querySelector("[data-mascot-sprite]");
  expect(idle).not.toBeNull();
  // Marcamos el nodo real: si React lo desmonta, la marca se va con él y el
  // navegador repinta la imagen de fondo desde cero (el parpadeo reportado).
  (idle as HTMLElement).dataset.continuityMark = "same-node";

  await render(decision);
  expect(
    host.querySelector<HTMLElement>("[data-mascot-sprite]")?.dataset
      .continuityMark,
  ).toBe("same-node");

  await render(null);
  expect(
    host.querySelector<HTMLElement>("[data-mascot-sprite]")?.dataset
      .continuityMark,
  ).toBe("same-node");

  root.unmount();
});
