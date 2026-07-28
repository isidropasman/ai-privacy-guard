import { describe, expect, it } from "vitest";
import { resolveAccessChannel } from "./accessChannel";

describe("resolveAccessChannel", () => {
  it.each([
    [" https://example.com/access ", "https://example.com/access"],
    [
      "https://security.example.co/request?team=compliance",
      "https://security.example.co/request?team=compliance",
    ],
  ])("habilita el canal HTTPS válido %s", (value, href) => {
    expect(resolveAccessChannel(value)).toEqual({
      status: "available",
      href,
    });
  });

  it.each([
    undefined,
    "",
    "invalid",
    "https://",
    "http://example.com/access",
    "mailto:access@example.com",
    "mailto:access@",
    "mailto:@example.com",
    "javascript:alert(1)",
  ])("informa indisponibilidad para %s", (value) => {
    expect(resolveAccessChannel(value)).toEqual({
      status: "unavailable",
    });
  });
});
