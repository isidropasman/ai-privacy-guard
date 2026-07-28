import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { InteractiveDemo } from "./InteractiveDemo";

describe("InteractiveDemo", () => {
  it("detecta y anonimiza datos de cliente", async () => {
    const user = userEvent.setup();
    render(<InteractiveDemo />);

    await user.click(screen.getByRole("tab", { name: "Datos de cliente" }));
    expect(await screen.findByText(/Juan Pérez/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Enviar" }));
    expect(
      await screen.findByText("Encontré 2 datos sensibles."),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Anonimizar y enviar" }),
    );
    expect(await screen.findByText(/Solo sale la versión segura/)).toBeInTheDocument();
    expect(screen.getByText(/\[CONTACT_NAME\]/)).toBeInTheDocument();
  });
});
