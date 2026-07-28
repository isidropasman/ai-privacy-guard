import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { IncidentGallery } from "./IncidentGallery";

describe("IncidentGallery", () => {
  it("recorre enviar → hallazgos → anonimizar → enviado", async () => {
    const user = userEvent.setup();
    render(<IncidentGallery />);

    await user.click(screen.getByRole("button", { name: "Enviar" }));

    const anonymize = await screen.findByRole("button", {
      name: "Eliminar secretos y continuar",
    });
    expect(screen.getByRole("list", { name: "Hallazgos" })).toBeInTheDocument();

    await user.click(anonymize);

    const send = await screen.findByRole("button", { name: "Continuar envío" });
    expect(screen.getByText("[CONTRACT_PARTY]")).toBeInTheDocument();

    await user.click(send);

    expect(
      screen.getByRole("button", { name: "Probar de nuevo" }),
    ).toBeInTheDocument();
  });

  it("vuelve al estado inicial al cambiar de caso", async () => {
    const user = userEvent.setup();
    render(<IncidentGallery />);

    await user.click(screen.getByRole("button", { name: "Enviar" }));
    await screen.findByRole("list", { name: "Hallazgos" });

    await user.click(screen.getByRole("tab", { name: "Código" }));

    expect(screen.getByRole("button", { name: "Enviar" })).toBeInTheDocument();
    expect(screen.queryByRole("list", { name: "Hallazgos" })).toBeNull();
  });
});
