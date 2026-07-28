import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { IncidentDemo } from "./IncidentDemo";

describe("IncidentDemo", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it("recorre el análisis local hasta enviar una versión segura", () => {
    render(<IncidentDemo />);

    expect(screen.getByText("Propuesta_ACME_Q4.pdf")).toBeInTheDocument();
    expect(screen.getByText("38 páginas · 2.8 MB")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Analizar antes de enviar" }),
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "Cargando archivo localmente",
    );

    act(() => {
      vi.advanceTimersByTime(450);
    });
    expect(screen.getByRole("progressbar")).toHaveAccessibleName(
      "Progreso del análisis",
    );

    act(() => {
      vi.advanceTimersByTime(1_900);
    });

    const heatmap = screen.getByRole("list", {
      name: "Mapa de riesgo del documento",
    });
    expect(within(heatmap).getAllByRole("listitem")).toHaveLength(38);
    expect(
      within(heatmap).getByLabelText("Página 2: riesgo crítico"),
    ).toBeInTheDocument();
    expect(screen.getByText("18 hallazgos detectados")).toBeInTheDocument();
    expect(screen.getByText("Página 11")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Generar versión segura" }),
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "Protegiendo 18 hallazgos",
    );

    act(() => {
      vi.advanceTimersByTime(650);
    });
    expect(screen.getByText("Grupo Andino S.A.")).toBeInTheDocument();
    expect(screen.getAllByText("[CLIENT_NAME]").length).toBeGreaterThan(0);

    fireEvent.click(
      screen.getByRole("button", { name: "Aprobar cambios" }),
    );
    expect(screen.getByText("14.820")).toBeInTheDocument();
    expect(screen.getByText("42%")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Enviar versión segura" }),
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "Versión segura enviada",
    );
    expect(screen.queryByText("Grupo Andino S.A.")).not.toBeInTheDocument();
  });

  it("cancela el trabajo pendiente al desmontarse", () => {
    const { unmount } = render(<IncidentDemo />);

    fireEvent.click(
      screen.getByRole("button", { name: "Analizar antes de enviar" }),
    );
    expect(vi.getTimerCount()).toBe(1);

    unmount();

    expect(vi.getTimerCount()).toBe(0);
  });
});
