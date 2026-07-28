import type { SubmissionReview } from "../interception/SubmissionInterceptor";
import {
  createCriticalDetectorEngine,
  createDetectorEngine,
} from "../detection/createDetectorEngine";
import type { DetectionFinding } from "../detection/types";
import { RedactionEngine } from "../redaction/RedactionEngine";
import type { SettingsRepository } from "../storage/SettingsRepository";
import type { SubmissionOutcome } from "../telemetry/EventFactory";
import type { DecisionModalInput, UserDecision } from "../ui/showDecisionModal";
import { PolicyEngine } from "./PolicyEngine";

export type DecisionPresenter = (
  input: DecisionModalInput,
) => Promise<UserDecision>;

export type OutcomeReporter = (outcome: SubmissionOutcome) => void;

export interface PrivacyReviewOptions {
  readonly provider: string;
  readonly onOutcome?: OutcomeReporter;
  readonly now?: () => number;
}

export class PrivacyReviewService {
  private readonly policyEngine = new PolicyEngine();
  private readonly redactionEngine = new RedactionEngine();
  private readonly provider: string;
  private readonly onOutcome: OutcomeReporter | undefined;
  private readonly now: () => number;

  constructor(
    private readonly settingsRepository: SettingsRepository,
    private readonly decide: DecisionPresenter,
    private readonly copy: (text: string) => Promise<void>,
    options: PrivacyReviewOptions = { provider: "ChatGPT" },
  ) {
    this.provider = options.provider;
    this.onOutcome = options.onOutcome;
    this.now = options.now ?? (() => Date.now());
  }

  async review(text: string): Promise<SubmissionReview> {
    const startedAt = this.now();
    const criticalFindings = createCriticalDetectorEngine().detect({
      text,
      configuredTerms: [],
    });
    const criticalPolicy = this.policyEngine.evaluate(criticalFindings, text);
    const state = {
      originalMayBeSent: criticalPolicy.decision !== "BLOCK",
    };
    try {
      return await this.performReview(text, state, startedAt);
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
    startedAt: number,
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
      // Los envíos limpios no generan evento individual: sólo alimentan los
      // contadores agregados que viajan en el heartbeat.
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

    const report = (resolution: SubmissionOutcome["resolution"]) => {
      this.onOutcome?.({
        provider: this.provider,
        decision: policy.decision,
        resolution,
        score: policy.score,
        durationMs: this.now() - startedAt,
        findings,
      });
    };

    if (userDecision === "redact") {
      await this.settingsRepository.incrementCounter("redactedCount");
      report("redacted");
      return { kind: "allow", replacementText: redaction.text };
    }

    if (userDecision === "send-original") {
      const allowed = policy.decision === "WARN" || !settings.strictSecrets;
      report(allowed ? "sent_original" : "blocked");
      return allowed ? { kind: "allow" } : { kind: "interrupt" };
    }

    if (userDecision === "copy-safe") {
      await this.copy(redaction.text);
    }

    report(policy.decision === "BLOCK" ? "blocked" : "cancelled");
    return { kind: "interrupt" };
  }
}

export type { DetectionFinding };
