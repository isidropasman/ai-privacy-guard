import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProviderShowcase } from "./ProviderShowcase";

describe("ProviderShowcase", () => {
  it("lista los tres proveedores sin distinguir disponibilidad", () => {
    render(<ProviderShowcase />);

    const list = screen.getByRole("list", { name: "Proveedores" });

    expect(within(list).getAllByRole("listitem")).toHaveLength(3);
    expect(within(list).getByText("ChatGPT")).toBeTruthy();
    expect(within(list).getByText("Claude")).toBeTruthy();
    expect(within(list).getByText("Gemini")).toBeTruthy();
    expect(list.textContent).not.toContain("Próximamente");
  });
});
