import { describe, expect, test, vi } from "vitest";
import type { ProviderAdapter } from "../../../src/adapters/types";
import { initializeProvider } from "../../../src/adapters/initializeProvider";

function createProviderAdapter() {
  const stopObserving = vi.fn();
  const observeComposerChanges = vi.fn(() => stopObserving);

  const adapter: ProviderAdapter = {
    id: "fixture",
    matchesLocation: () => true,
    findComposer: () => null,
    getComposerText: () => "",
    setComposerText: () => undefined,
    findSendButton: () => null,
    isSendAction: () => false,
    triggerApprovedSubmission: async () => undefined,
    observeComposerChanges,
  };

  return { adapter, observeComposerChanges, stopObserving };
}

describe("initializeProvider", () => {
  test("initializes the same adapter only once", () => {
    const { adapter, observeComposerChanges } = createProviderAdapter();
    const onComposerChange = vi.fn();

    const firstCleanup = initializeProvider(adapter, onComposerChange);
    const secondCleanup = initializeProvider(adapter, onComposerChange);

    expect(observeComposerChanges).toHaveBeenCalledOnce();
    expect(secondCleanup).toBe(firstCleanup);
  });

  test("allows initialization again after cleanup", () => {
    const { adapter, observeComposerChanges, stopObserving } =
      createProviderAdapter();
    const cleanup = initializeProvider(adapter, vi.fn());

    cleanup();
    initializeProvider(adapter, vi.fn());

    expect(stopObserving).toHaveBeenCalledOnce();
    expect(observeComposerChanges).toHaveBeenCalledTimes(2);
  });
});
