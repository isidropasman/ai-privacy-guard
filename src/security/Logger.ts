import type { PolicyDecision } from "../policy/PolicyEngine";

export type SafeLogEvent =
  | { readonly event: "detector-executed"; readonly detectorId: string }
  | { readonly event: "findings-count"; readonly count: number }
  | { readonly event: "decision"; readonly decision: PolicyDecision };

export type LogSink = (event: SafeLogEvent) => void;

export class Logger {
  constructor(
    private readonly enabled: boolean,
    private readonly sink: LogSink,
  ) {}

  write(event: SafeLogEvent): void {
    if (this.enabled) this.sink(event);
  }
}
