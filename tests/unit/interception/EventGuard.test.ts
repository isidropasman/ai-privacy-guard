import { describe, expect, test } from "vitest";
import { EventGuard } from "../../../src/interception/EventGuard";

describe("EventGuard", () => {
  test("marks only the approved submission transaction as trusted", async () => {
    const guard = new EventGuard();
    const states: boolean[] = [];

    await guard.runApproved(async () => {
      states.push(guard.isApproved());
      await Promise.resolve();
      states.push(guard.isApproved());
    });
    states.push(guard.isApproved());

    expect(states).toEqual([true, true, false]);
  });

  test("restores the blocked state when approved submission fails", async () => {
    const guard = new EventGuard();

    await expect(
      guard.runApproved(async () => {
        throw new Error("submission failed");
      }),
    ).rejects.toThrow("submission failed");

    expect(guard.isApproved()).toBe(false);
  });
});
