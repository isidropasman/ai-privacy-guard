// @vitest-environment jsdom

import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import { PopupApp } from "../../../entrypoints/popup/App";
import {
  SettingsRepository,
  type SettingsStorage,
} from "../../../src/storage/SettingsRepository";

const reactTestGlobal = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT: boolean;
};
reactTestGlobal.IS_REACT_ACT_ENVIRONMENT = true;

class MemoryStorage implements SettingsStorage {
  private values: Record<string, unknown> = {};
  async get(key: string): Promise<Record<string, unknown>> {
    return { [key]: this.values[key] };
  }
  async set(values: Record<string, unknown>): Promise<void> {
    this.values = { ...this.values, ...values };
  }
}

async function settle() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

afterEach(() => {
  document.body.replaceChildren();
});

describe("PopupApp", () => {
  test("loads settings and stores a voluntary confidential term", async () => {
    const repository = new SettingsRepository(new MemoryStorage());
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(<PopupApp repository={repository} />);
    });
    await settle();

    expect(container.textContent).toContain("Protección activa");
    expect(container.textContent).toContain("intervenciones");
    expect(container.querySelector(".stats strong")?.textContent).toBe("0");

    const input = container.querySelector<HTMLInputElement>(
      'input[name="confidential-term"]',
    );
    const setter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )?.set;
    setter?.call(input, "Proyecto Cóndor");
    input?.dispatchEvent(new Event("input", { bubbles: true }));
    await act(async () => {
      container
        .querySelector<HTMLButtonElement>('[data-action="add-term"]')
        ?.click();
    });

    expect((await repository.get()).confidentialTerms).toEqual([
      "Proyecto Cóndor",
    ]);
    await act(async () => root.unmount());
  });
});
