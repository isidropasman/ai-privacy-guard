import type { SubmissionReview } from "../interception/SubmissionInterceptor";
import {
  createCriticalDetectorEngine,
  createDetectorEngine,
} from "../detection/createDetectorEngine";
import { RedactionEngine } from "../redaction/RedactionEngine";
import type { SettingsRepository } from "../storage/SettingsRepository";
import type { DecisionModalInput, UserDecision } from "../ui/showDecisionModal";
import { PolicyEngine } from "./PolicyEngine";

export type DecisionPresenter = (
  input: DecisionModalInput,
) => Promise<UserDecision>;

export class PrivacyReviewService {
  private readonly policyEngine = new PolicyEngine();
  private readonly redactionEngine = new RedactionEngine();

  constructor(
    private readonly settingsRepository: SettingsRepository,
    private readonly decide: DecisionPresenter,
    private readonly copy: (text: string) => Promise<void>,
  ) {}

  async review(text: string): Promise<SubmissionReview> {
    const criticalFindings = createCriticalDetectorEngine().detect({
      text,
      configuredTerms: [],
    });
    const criticalPolicy = this.policyEngine.evaluate(criticalFindings, text);
    const state = {
      originalMayBeSent: criticalPolicy.decision !== "BLOCK",
    };
    try {
      return await this.performReview(text, state);
    } catch {
      return {
        kind: "error",
        originalMayBeSent: state.originalMayBeSent,
      };
    }
  }

  private async performReview(
    text: string,
    state: { originalMayBeSent: boolean },
  ): Promise<SubmissionReview> {
    const settings = await this.settingsRepository.get();
    const findings = createDetectorEngine(settings).detect({
      text,
      configuredTerms: settings.confidentialTerms,
    });
    const policy = this.policyEngine.evaluate(findings, text);
    state.originalMayBeSent = policy.decision !== "BLOCK";

    if (policy.decision === "ALLOW") {
      await this.settingsRepository.incrementCounter("allowedCount");
      return { kind: "allow" };
    }

    await this.settingsRepository.incrementCounter(
      policy.decision === "BLOCK" ? "blockedCount" : "warnedCount",
    );
    const redaction = this.redactionEngine.redact(text, findings);
    const userDecision = await this.decide({
      decision: policy.decision,
      score: policy.score,
      findings,
      redactedText: redaction.text,
      allowCriticalOverride:
        policy.decision === "BLOCK" && !settings.strictSecrets,
    });

    if (userDecision === "redact") {
      await this.settingsRepository.incrementCounter("redactedCount");
      return { kind: "allow", replacementText: redaction.text };
    }

    if (userDecision === "send-original") {
      return policy.decision === "WARN" || !settings.strictSecrets
        ? { kind: "allow" }
        : { kind: "interrupt" };
    }

    if (userDecision === "copy-safe") {
      await this.copy(redaction.text);
    }

    return { kind: "interrupt" };
  }
}
