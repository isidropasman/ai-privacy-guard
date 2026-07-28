import { describe, expect, test } from "vitest";
import {
  reduceMascotState,
  type MascotEvent,
  type MascotState,
} from "../../../src/ui/mascot/mascotState";

describe("reduceMascotState", () => {
  test.each<readonly [MascotEvent, MascotState]>([
    [{ kind: "review-started" }, { kind: "scanning" }],
    [
      { kind: "allowed" },
      { kind: "allow", message: "Todo limpio. Podés enviarlo." },
    ],
    [
      { kind: "verification-requested" },
      {
        kind: "verify",
        message: "Encontré información sensible. Revisala antes de seguir.",
      },
    ],
    [
      { kind: "redacted" },
      {
        kind: "redacted",
        message: "Anonimicé los datos sensibles antes de enviarlo.",
      },
    ],
    [
      { kind: "blocked" },
      { kind: "block", message: "Esto no puede salir sin que lo corrijas." },
    ],
    [
      { kind: "failed" },
      {
        kind: "error",
        message: "No pude completar la revisión local.",
      },
    ],
    [{ kind: "reset" }, { kind: "idle" }],
  ])("maps $kind to its visible state", (event, expected) => {
    expect(reduceMascotState({ kind: "idle" }, event)).toEqual(expected);
  });
});
