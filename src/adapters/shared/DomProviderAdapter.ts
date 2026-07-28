import type { ProviderAdapter } from "../types";
import { findFirstElement } from "./selectors";

interface NativeEditingDocument {
  execCommand?: (
    commandId: string,
    showUi?: boolean,
    value?: string,
  ) => boolean;
}

export interface DomProviderConfig {
  readonly id: string;
  readonly hostnames: ReadonlySet<string>;
  readonly composerSelectors: readonly [string, ...string[]];
  readonly sendButtonSelectors: readonly string[];
}

export class DomProviderAdapter implements ProviderAdapter {
  readonly id: string;

  constructor(
    private readonly document: Document,
    private readonly config: DomProviderConfig,
  ) {
    this.id = config.id;
  }

  matchesLocation(location: Location): boolean {
    return this.config.hostnames.has(location.hostname);
  }

  findComposer(): HTMLElement | null {
    const semanticComposer = this.document.querySelector<HTMLElement>(
      this.config.composerSelectors[0],
    );
    if (semanticComposer !== null) {
      return semanticComposer;
    }

    const sendForm = this.findSendButton()?.closest("form");
    if (sendForm !== undefined && sendForm !== null) {
      const relatedComposer = findFirstElement(
        sendForm,
        this.config.composerSelectors,
      );
      if (relatedComposer !== null) {
        return relatedComposer;
      }
    }

    return findFirstElement(this.document, this.config.composerSelectors);
  }

  getComposerText(): string {
    const composer = this.findComposer();

    if (composer instanceof HTMLTextAreaElement) {
      return composer.value;
    }

    return composer?.textContent ?? "";
  }

  setComposerText(text: string): void {
    const composer = this.findComposer();
    if (composer === null) {
      return;
    }

    if (composer instanceof HTMLTextAreaElement) {
      const updated = Reflect.set(
        HTMLTextAreaElement.prototype,
        "value",
        text,
        composer,
      );
      if (!updated) {
        composer.value = text;
      }
      composer.dispatchEvent(
        new InputEvent("input", {
          bubbles: true,
          data: text,
          inputType: "insertText",
        }),
      );
      return;
    }

    composer.focus();
    const selection = this.document.getSelection();
    const range = this.document.createRange();
    range.selectNodeContents(composer);
    selection?.removeAllRanges();
    selection?.addRange(range);

    // Rich-text editors (ProseMirror, Quill) commit state only through a native editing transaction.
    const nativeEditingDocument = this.document as NativeEditingDocument;
    if (nativeEditingDocument.execCommand?.("insertText", false, text)) {
      return;
    }

    composer.textContent = text;
    composer.dispatchEvent(new InputEvent("input", { bubbles: true }));
  }

  findSendButton(): HTMLElement | null {
    return findFirstElement(this.document, this.config.sendButtonSelectors);
  }

  isSendAction(event: Event): boolean {
    if (event instanceof KeyboardEvent) {
      return event.key === "Enter" && !event.shiftKey && !event.isComposing;
    }

    const target = event.target;
    if (event.type === "submit" && target instanceof HTMLFormElement) {
      return this.findComposer()?.closest("form") === target;
    }

    if (!(target instanceof Element)) {
      return false;
    }

    return this.config.sendButtonSelectors.some(
      (selector) => target.closest(selector) !== null,
    );
  }

  async triggerApprovedSubmission(): Promise<void> {
    this.findSendButton()?.click();
  }

  observeComposerChanges(callback: () => void): () => void {
    let currentComposer = this.findComposer();
    const observer = new MutationObserver(() => {
      const nextComposer = this.findComposer();
      if (nextComposer === currentComposer) {
        return;
      }

      currentComposer = nextComposer;
      callback();
    });

    const observationRoot =
      this.document.querySelector("main") ?? this.document.body;
    observer.observe(observationRoot, {
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }
}
