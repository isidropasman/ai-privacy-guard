import { describe, expect, test, vi } from "vitest";
import { Logger } from "../../../src/security/Logger";

describe("Logger", () => {
  test("is silent when development logging is disabled", () => {
    const sink = vi.fn();
    const logger = new Logger(false, sink);

    logger.write({ event: "findings-count", count: 2 });

    expect(sink).not.toHaveBeenCalled();
  });

  test("emits only structured safe events in development", () => {
    const sink = vi.fn();
    const logger = new Logger(true, sink);

    logger.write({ event: "detector-executed", detectorId: "api-key" });
    logger.write({ event: "decision", decision: "BLOCK" });

    expect(sink.mock.calls).toEqual([
      [{ event: "detector-executed", detectorId: "api-key" }],
      [{ event: "decision", decision: "BLOCK" }],
    ]);
  });
});
