import { createRef } from "react";
import { createRoot, type Root } from "react-dom/client";
import { createAdapterForLocation } from "../../src/adapters/createAdapterForLocation";
import { initializeProvider } from "../../src/adapters/initializeProvider";
import {
  SubmissionInterceptor,
  type SubmissionReview,
} from "../../src/interception/SubmissionInterceptor";
import { PrivacyReviewService } from "../../src/policy/PrivacyReviewService";
import { SettingsRepository } from "../../src/storage/SettingsRepository";
import {
  SecurityGenieController,
  type SecurityGenieHandle,
} from "../../src/ui/mascot/SecurityGenieController";
import styles from "./styles.css?inline";

export default defineContentScript({
  matches: [
    "https://chatgpt.com/*",
    "https://chat.openai.com/*",
    "https://claude.ai/*",
    "https://gemini.google.com/*",
  ],
  runAt: "document_idle",
  async main(ctx) {
    const adapter = createAdapterForLocation(document, window.location);
    if (adapter === null) {
      return;
    }

    const genieRef = createRef<SecurityGenieHandle>();
    const ui = await createShadowRootUi<Root>(ctx, {
      name: "ai-privacy-guard",
      position: "inline",
      anchor: "body",
      css: styles,
      onMount(container) {
        const root = createRoot(container);
        root.render(<SecurityGenieController ref={genieRef} />);
        return root;
      },
      onRemove(root) {
        root?.unmount();
      },
    });

    ui.mount();

    const syncComposerState = () => {
      ui.shadowHost.dataset.composer =
        adapter.findComposer() === null ? "waiting" : "ready";
    };
    const stopProvider = initializeProvider(adapter, syncComposerState);
    const settingsRepository = new SettingsRepository(browser.storage.local);
    const reviewService = new PrivacyReviewService(
      settingsRepository,
      (input) =>
        genieRef.current?.requestDecision(input) ?? Promise.resolve("cancel"),
      (text) => navigator.clipboard.writeText(text),
    );
    const eventForReview = (review: SubmissionReview) => {
      if (review.kind === "error") return { kind: "failed" } as const;
      if (review.kind === "interrupt") {
        return review.outcome === "blocked"
          ? ({ kind: "blocked" } as const)
          : ({ kind: "reset" } as const);
      }
      return review.outcome === "redacted"
        ? ({ kind: "redacted" } as const)
        : ({ kind: "allowed" } as const);
    };
    const submissionInterceptor = new SubmissionInterceptor({
      root: document,
      adapter,
      review: (text) => reviewService.review(text),
      onReviewStarted: () => {
        genieRef.current?.emit({ kind: "review-started" });
      },
      onReviewCompleted: (review) => {
        genieRef.current?.emit(eventForReview(review));
      },
      onInterrupted: () => {
        ui.shadowHost.dataset.protectionState = "interrupted";
      },
      onReviewError: async (originalMayBeSent) => {
        const decision =
          (await genieRef.current?.requestDecision({
            decision: "WARN",
            score: 0,
            findings: [],
            redactedText: "",
            technicalError: true,
            originalMayBeSent,
          })) ?? "review";
        return decision === "send-original" && originalMayBeSent
          ? "allow"
          : "interrupt";
      },
      onError: () => {
        ui.shadowHost.dataset.protectionState = "error";
        genieRef.current?.emit({ kind: "failed" });
      },
    });
    const stopSubmissionInterceptor = submissionInterceptor.start();

    syncComposerState();
    ctx.onInvalidated(() => {
      stopSubmissionInterceptor();
      stopProvider();
    });
  },
});
