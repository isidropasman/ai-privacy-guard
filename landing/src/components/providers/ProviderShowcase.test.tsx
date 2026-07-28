import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProviderShowcase } from "./ProviderShowcase";

describe("ProviderShowcase", () => {
  it("marca como disponible sólo al proveedor que la extensión soporta hoy", () => {
    render(<ProviderShowcase />);

    const list = screen.getByRole("list", { name: "Proveedores" });
    const available = list.querySelectorAll('li[data-status="available"]');

    expect(within(list).getAllByRole("listitem")).toHaveLength(3);
    expect(available).toHaveLength(1);
    expect(available.item(0)?.textContent).toContain("ChatGPT");
    expect(within(list).getAllByText("Próximamente")).toHaveLength(2);
  });
});
