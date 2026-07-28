import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Navbar } from "./Navbar";

describe("Navbar", () => {
  it("expone el estado del menú y lo cierra al navegar", async () => {
    const user = userEvent.setup();

    render(<Navbar />);

    const menuButton = screen.getByRole("button", { name: "Abrir menú" });

    expect(menuButton).toHaveAttribute("aria-expanded", "false");

    await user.click(menuButton);

    expect(menuButton).toHaveAttribute("aria-expanded", "true");
    expect(menuButton).toHaveAccessibleName("Cerrar menú");

    await user.click(screen.getByRole("link", { name: "Cómo funciona" }));

    expect(menuButton).toHaveAttribute("aria-expanded", "false");
    expect(menuButton).toHaveAccessibleName("Abrir menú");
  });
});
