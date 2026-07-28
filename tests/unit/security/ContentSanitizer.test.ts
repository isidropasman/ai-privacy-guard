import { describe, expect, test } from "vitest";
import { ContentSanitizer } from "../../../src/security/ContentSanitizer";

describe("ContentSanitizer", () => {
  test("normalizes voluntary terms and rejects control characters", () => {
    expect(ContentSanitizer.normalizeTerm("  Proyecto Cóndor  ")).toBe(
      "Proyecto Cóndor",
    );
    expect(ContentSanitizer.normalizeTerm("secret\u0000value")).toBeNull();
  });

  test("caps safe previews without cutting Unicode surrogate pairs", () => {
    expect(ContentSanitizer.safePreview("🙂🙂🙂", 2)).toBe("🙂🙂…");
  });
});
