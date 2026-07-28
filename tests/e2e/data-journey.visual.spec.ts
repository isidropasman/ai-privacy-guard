import { expect, test, type Page } from "@playwright/test";

async function openSimulator(page: Page) {
  await page.goto("/data-journey-test.html");
  await expect(
    page.getByRole("heading", {
      name: "Seguí el dato hasta donde queda guardado.",
    }),
  ).toBeVisible();
}

async function advanceToPersistence(page: Page) {
  await page.getByRole("button", { name: "Iniciar recorrido" }).click();
  const advance = page.getByRole("button", { name: "Avanzar recorrido" });

  for (let step = 0; step < 3; step += 1) {
    await advance.click();
  }
}

test("mantiene el paquete visible y móvil a 800px", async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 900 });
  await openSimulator(page);

  await page.getByRole("button", { name: "Iniciar recorrido" }).click();
  const packet = page.locator(".journey-packet");
  await expect(packet).toBeVisible();
  const employeeLeft = await packet.evaluate(
    (element) => getComputedStyle(element).left,
  );

  await page.getByRole("button", { name: "Avanzar recorrido" }).click();

  await expect(packet).toHaveAttribute("aria-label", "Paquete anonimizado");
  await expect
    .poll(() => packet.evaluate((element) => getComputedStyle(element).left))
    .not.toBe(employeeLeft);
});

test("muestra la persistencia externa con el tratamiento visual de riesgo", async ({
  page,
}) => {
  await openSimulator(page);
  await page.getByRole("button", { name: "Sin Redacta" }).click();
  await advanceToPersistence(page);

  const persistence = page.getByText(
    "Persistencia externa: contenido original",
  );
  await expect(persistence).toBeVisible();
  await expect
    .poll(() =>
      persistence.evaluate((element) => getComputedStyle(element).color),
    )
    .toBe("rgb(255, 170, 163)");

  await page.getByRole("button", { name: "Con Redacta" }).click();
  await expect(persistence).toHaveCount(0);
});

test("aplica el fallback instantáneo con reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openSimulator(page);

  await page.getByRole("button", { name: "Iniciar recorrido" }).click();
  const packet = page.locator(".journey-packet");
  await expect(packet).toBeVisible();

  const motionState = await packet.evaluate((element) => {
    const node = document.querySelector(".journey-node");

    return {
      opacity: getComputedStyle(element).opacity,
      runningAnimations: element
        .getAnimations()
        .filter((animation) => animation.playState === "running").length,
      nodeTransitionSeconds:
        node instanceof HTMLElement
          ? Number.parseFloat(getComputedStyle(node).transitionDuration)
          : null,
    };
  });

  expect(motionState).toMatchObject({
    opacity: "1",
    runningAnimations: 0,
  });
  expect(motionState.nodeTransitionSeconds).not.toBeNull();
  expect(motionState.nodeTransitionSeconds ?? 1).toBeLessThan(0.001);
});
