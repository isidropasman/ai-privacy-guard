import type { ProviderAdapter } from "./types";

const activeProviders = new WeakMap<ProviderAdapter, () => void>();

export function initializeProvider(
  adapter: ProviderAdapter,
  onComposerChange: () => void,
): () => void {
  const activeCleanup = activeProviders.get(adapter);
  if (activeCleanup !== undefined) {
    return activeCleanup;
  }

  const stopObserving = adapter.observeComposerChanges(onComposerChange);
  const cleanup = () => {
    if (activeProviders.get(adapter) !== cleanup) {
      return;
    }

    activeProviders.delete(adapter);
    stopObserving();
  };

  activeProviders.set(adapter, cleanup);
  return cleanup;
}
