import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ApiKeyLeakSimulator } from "./ApiKeyLeakSimulator";

describe("ApiKeyLeakSimulator", () => {
  it("muestra la clave real solo en el carril sin protección", () => {
    render(<ApiKeyLeakSimulator />);

    const heading = screen.getByRole("heading", {
      name: "Tus API keys quedan guardadas en los servidores de tu proveedor.",
    });
    const section = heading.closest("section");

    if (section === null) {
      throw new Error("La sección del simulador no se encontró");
    }

    expect(within(section).getByText("Sin Redacta")).toBeInTheDocument();
    expect(within(section).getByText("Con Redacta")).toBeInTheDocument();
    expect(
      within(section).getAllByText(/sk-proj-/).length,
    ).toBeGreaterThan(0);
    expect(within(section).getByText("[OPENAI_API_KEY]")).toBeInTheDocument();
  });
});
