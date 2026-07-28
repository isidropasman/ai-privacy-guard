export type MascotState =
  | { readonly kind: "idle" }
  | { readonly kind: "scanning" }
  | { readonly kind: "allow"; readonly message: string }
  | { readonly kind: "verify"; readonly message: string }
  | { readonly kind: "redacted"; readonly message: string }
  | { readonly kind: "block"; readonly message: string }
  | { readonly kind: "error"; readonly message: string };

export type MascotEvent =
  | { readonly kind: "review-started" }
  | { readonly kind: "allowed" }
  | { readonly kind: "verification-requested" }
  | { readonly kind: "redacted" }
  | { readonly kind: "blocked" }
  | { readonly kind: "failed" }
  | { readonly kind: "reset" };

export function reduceMascotState(
  _state: MascotState,
  event: MascotEvent,
): MascotState {
  switch (event.kind) {
    case "review-started":
      return { kind: "scanning" };
    case "allowed":
      return { kind: "allow", message: "Todo limpio. Podés enviarlo." };
    case "verification-requested":
      return {
        kind: "verify",
        message: "Encontré información sensible. Revisala antes de seguir.",
      };
    case "redacted":
      return {
        kind: "redacted",
        message: "Anonimicé los datos sensibles antes de enviarlo.",
      };
    case "blocked":
      return {
        kind: "block",
        message: "Esto no puede salir sin que lo corrijas.",
      };
    case "failed":
      return {
        kind: "error",
        message: "No pude completar la revisión local.",
      };
    case "reset":
      return { kind: "idle" };
  }
}
