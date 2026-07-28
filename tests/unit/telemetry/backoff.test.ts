import { describe, expect, test } from "vitest";
import {
  backoffBaseMs,
  backoffMaxMs,
  computeBackoffMs,
} from "../../../src/telemetry/backoff";

describe("computeBackoffMs", () => {
  test("el primer intento parte de la base", () => {
    expect(computeBackoffMs(0, () => 1)).toBe(backoffBaseMs);
    expect(computeBackoffMs(0, () => 0)).toBe(backoffBaseMs / 2);
  });

  test("crece exponencialmente", () => {
    expect(computeBackoffMs(1, () => 1)).toBe(backoffBaseMs * 2);
    expect(computeBackoffMs(2, () => 1)).toBe(backoffBaseMs * 4);
  });

  test("nunca supera el tope", () => {
    for (let attempt = 0; attempt < 40; attempt += 1) {
      expect(computeBackoffMs(attempt, () => 1)).toBeLessThanOrEqual(
        backoffMaxMs,
      );
    }
  });

  test("el jitter mantiene el resultado entre la mitad y el total", () => {
    for (const value of [0, 0.3, 0.7, 0.999]) {
      const result = computeBackoffMs(3, () => value);
      const capped = Math.min(backoffMaxMs, backoffBaseMs * 8);
      expect(result).toBeGreaterThanOrEqual(capped / 2);
      expect(result).toBeLessThanOrEqual(capped);
    }
  });

  test("un intento negativo no rompe el cálculo", () => {
    expect(computeBackoffMs(-3, () => 1)).toBe(backoffBaseMs);
  });
});
