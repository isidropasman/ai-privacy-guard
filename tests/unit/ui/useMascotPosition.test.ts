import { describe, expect, test } from "vitest";
import { clampMascotPosition } from "../../../src/ui/mascot/useMascotPosition";

const viewport = { width: 1000, height: 800 };

describe("clampMascotPosition", () => {
  test("keeps a position already inside the viewport", () => {
    expect(clampMascotPosition({ x: 300, y: 200 }, viewport)).toEqual({
      x: 300,
      y: 200,
    });
  });

  test("pulls the mascot back inside when dropped past the edges", () => {
    expect(clampMascotPosition({ x: -50, y: 5000 }, viewport)).toEqual({
      x: 0,
      y: 688,
    });
  });

  test("never returns negative coordinates on a viewport smaller than the mascot", () => {
    expect(
      clampMascotPosition({ x: 40, y: 40 }, { width: 60, height: 60 }),
    ).toEqual({ x: 0, y: 0 });
  });
});
