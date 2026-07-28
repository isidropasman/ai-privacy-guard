import type { ProviderAdapter } from "../adapters/types";
import { EventGuard } from "./EventGuard";

export type SubmissionReview =
  | { readonly kind: "allow"; readonly outcome: "clean" }
  | {
      readonly kind: "allow";
      readonly outcome: "redacted";
      readonly replacementText: string;
    }
  | {
      readonly kind: "interrupt";
      readonly outcome: "cancelled" | "blocked";
    }
  | { readonly kind: "error"; readonly originalMayBeSent: boolean };

type ReviewErrorResolution = "allow" | "interrupt";

interface SubmissionInterceptorOptions {
  readonly root: Document;
  readonly adapter: ProviderAdapter;
  readonly review: (text: string) => Promise<SubmissionReview>;
  readonly onReviewStarted: () => void;
  readonly onReviewCompleted: (review: SubmissionReview) => void;
  readonly onInterrupted: () => void;
  readonly onReviewError: (
    originalMayBeSent: boolean,
  ) => Promise<ReviewErrorResolution>;
  readonly onError: (error: unknown) => void;
}

export class SubmissionInterceptor {
  private readonly eventGuard = new EventGuard();
  private cleanup: (() => void) | undefined;
  private reviewInFlight = false;

  constructor(private readonly options: SubmissionInterceptorOptions) {}

  start(): () => void {
    if (this.cleanup !== undefined) {
      return this.cleanup;
    }

    const listener = (event: Event) => this.handleEvent(event);
    const keyboardTarget = this.options.root.defaultView ?? this.options.root;

    for (const eventType of ["click", "submit"] as const) {
      this.options.root.addEventListener(eventType, listener, true);
    }
    keyboardTarget.addEventListener("keydown", listener, true);

    const cleanup = () => {
      if (this.cleanup !== cleanup) {
        return;
      }

      for (const eventType of ["click", "submit"] as const) {
        this.options.root.removeEventListener(eventType, listener, true);
      }
      keyboardTarget.removeEventListener("keydown", listener, true);
      this.cleanup = undefined;
    };
    this.cleanup = cleanup;

    return cleanup;
  }

  private handleEvent(event: Event): void {
    if (
      this.eventGuard.isApproved() ||
      !this.options.adapter.isSendAction(event)
    ) {
      return;
    }

    event.preventDefault();
    event.stopImmediatePropagation();

    if (this.reviewInFlight) {
      return;
    }

    this.reviewInFlight = true;
    this.options.onReviewStarted();
    void this.reviewAndContinue();
  }

  private async reviewAndContinue(): Promise<void> {
    const text = this.options.adapter.getComposerText();

    try {
      const review = await this.options.review(text);
      this.options.onReviewCompleted(review);
      if (review.kind === "error") {
        const resolution = await this.options.onReviewError(
          review.originalMayBeSent,
        );
        if (resolution === "allow" && review.originalMayBeSent) {
          await this.eventGuard.runApproved(() =>
            this.options.adapter.triggerApprovedSubmission(),
          );
        } else {
          this.options.onInterrupted();
        }
        return;
      }

      if (review.kind === "interrupt") {
        this.options.onInterrupted();
        return;
      }

      if (review.outcome === "redacted") {
        this.options.adapter.setComposerText(review.replacementText);
        // ProseMirror commits native DOM edits after the current event cycle.
        await new Promise<void>((resolve) => {
          setTimeout(resolve, 0);
        });
      }
      await this.eventGuard.runApproved(() =>
        this.options.adapter.triggerApprovedSubmission(),
      );
    } catch (error: unknown) {
      this.options.onError(error);
    } finally {
      this.reviewInFlight = false;
    }
  }
}
