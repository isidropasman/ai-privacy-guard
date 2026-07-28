export type IncidentDemoState =
  | "ready"
  | "loading-file"
  | "scanning"
  | "findings"
  | "redacting"
  | "review"
  | "safe-to-send"
  | "sent";

export type IncidentDemoEvent =
  | { readonly type: "START" }
  | { readonly type: "FILE_LOADED" }
  | { readonly type: "SCAN_COMPLETED" }
  | { readonly type: "REDACT" }
  | { readonly type: "REDACTION_COMPLETED" }
  | { readonly type: "APPROVE" }
  | { readonly type: "SEND" }
  | { readonly type: "RESET" };

export function transitionIncident(
  state: IncidentDemoState,
  event: IncidentDemoEvent,
): IncidentDemoState {
  switch (event.type) {
    case "RESET":
      return "ready";
    case "START":
      return state === "ready" ? "loading-file" : state;
    case "FILE_LOADED":
      return state === "loading-file" ? "scanning" : state;
    case "SCAN_COMPLETED":
      return state === "scanning" ? "findings" : state;
    case "REDACT":
      return state === "findings" ? "redacting" : state;
    case "REDACTION_COMPLETED":
      return state === "redacting" ? "review" : state;
    case "APPROVE":
      return state === "review" ? "safe-to-send" : state;
    case "SEND":
      return state === "safe-to-send" ? "sent" : state;
  }
}
