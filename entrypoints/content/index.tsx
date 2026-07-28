import { createRoot, type Root } from "react-dom/client";
import { ChatGPTAdapter } from "../../src/adapters/chatgpt/ChatGPTAdapter";
import { initializeProvider } from "../../src/adapters/initializeProvider";
import { SubmissionInterceptor } from "../../src/interception/SubmissionInterceptor";
import { PrivacyReviewService } from "../../src/policy/PrivacyReviewService";
import { SettingsRepository } from "../../src/storage/SettingsRepository";
import { RiskBadge } from "../../src/ui/RiskBadge";
import { showDecisionModal } from "../../src/ui/showDecisionModal";
import { showTechnicalErrorModal } from "../../src/ui/showTechnicalErrorModal";
import styles from "./styles.css?inline";

export default defineContentScript({
  matches: ["https://chatgpt.com/*", "https://chat.openai.com/*"],
  runAt: "document_idle",
  async main(ctx) {
    const ui = await createShadowRootUi<Root>(ctx, {
      name: "ai-privacy-guard",
      position: "inline",
      anchor: "body",
      css: styles,
      onMount(container) {
        const root = createRoot(container);
        root.render(<RiskBadge />);
        return root;
      },
      onRemove(root) {
        root?.unmount();
      },
    });

    ui.mount();

    const adapter = new ChatGPTAdapter(document);
    const syncComposerState = () => {
      ui.shadowHost.dataset.composer =
        adapter.findComposer() === null ? "waiting" : "ready";
    };
    const stopProvider = initializeProvider(adapter, syncComposerState);
    const settingsRepository = new SettingsRepository(browser.storage.local);
    const reviewService = new PrivacyReviewService(
      settingsRepository,
      (input) => showDecisionModal(ui.shadow, input),
      (text) => navigator.clipboard.writeText(text),
    );
    const submissionInterceptor = new SubmissionInterceptor({
      root: document,
      adapter,
      review: (text) => reviewService.review(text),
      onInterrupted: () => {
        ui.shadowHost.dataset.protectionState = "interrupted";
      },
      onReviewError: async (originalMayBeSent) => {
        const decision = await showTechnicalErrorModal(
          ui.shadow,
          originalMayBeSent,
        );
        return decision === "send-original" && originalMayBeSent
          ? "allow"
          : "interrupt";
      },
      onError: () => {
        ui.shadowHost.dataset.protectionState = "error";
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
