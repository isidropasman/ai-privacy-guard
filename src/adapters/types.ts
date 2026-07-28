export interface ProviderAdapter {
  readonly id: string;
  matchesLocation(location: Location): boolean;
  findComposer(): HTMLElement | null;
  getComposerText(): string;
  setComposerText(text: string): void;
  findSendButton(): HTMLElement | null;
  isSendAction(event: Event): boolean;
  triggerApprovedSubmission(): Promise<void>;
  observeComposerChanges(callback: () => void): () => void;
}
