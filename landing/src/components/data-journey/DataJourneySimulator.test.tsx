import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { DataJourneySimulator } from "./DataJourneySimulator";

afterEach(cleanup);

function completeJourney() {
  const advance = screen.getByRole("button", { name: "Avanzar recorrido" });

  for (let step = 0; step < 6; step += 1) {
    fireEvent.click(advance);
  }
}

describe("DataJourneySimulator", () => {
  it("muestra la persistencia externa al completar el recorrido sin Redacta", () => {
    render(<DataJourneySimulator />);

    fireEvent.click(screen.getByRole("button", { name: "Sin Redacta" }));
    fireEvent.click(screen.getByRole("button", { name: "Iniciar recorrido" }));
    completeJourney();

    expect(screen.getByRole("status")).toHaveTextContent(
      "El prompt sensible quedó persistido fuera de tu control.",
    );
    expect(
      screen.getByText("Persistencia externa: contenido original"),
    ).toBeInTheDocument();
  });

  it("muestra la sanitización local al completar el recorrido con Redacta", () => {
    render(<DataJourneySimulator />);

    fireEvent.click(screen.getByRole("button", { name: "Con Redacta" }));
    fireEvent.click(screen.getByRole("button", { name: "Iniciar recorrido" }));
    completeJourney();

    expect(screen.getByRole("status")).toHaveTextContent(
      "El proveedor solo recibió datos anonimizados.",
    );
    expect(screen.getByText("Sanitizado localmente")).toBeInTheDocument();
    const outboundPayload = screen.getByRole("group", {
      name: "Payload saliente anonimizado",
    });
    expect(outboundPayload).toHaveTextContent(
      "[CLIENT_NAME] · [CONFIDENTIAL_MARGIN] · [CONTACT_EMAIL]",
    );
    expect(
      within(outboundPayload).queryByText(
        /Grupo Andino|38,4%|maria@grupoandino\.com/,
      ),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Persistencia externa: contenido original"),
    ).not.toBeInTheDocument();
  });

  it("expone un único paso actual en la frontera protegida", () => {
    render(<DataJourneySimulator />);

    fireEvent.click(screen.getByRole("button", { name: "Iniciar recorrido" }));
    fireEvent.click(screen.getByRole("button", { name: "Avanzar recorrido" }));

    const currentSteps = screen.getAllByRole("listitem", { current: "step" });
    expect(currentSteps).toHaveLength(1);
    expect(currentSteps[0]).toHaveTextContent("Redacta");
  });
});
