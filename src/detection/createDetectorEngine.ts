import type { PrivacyGuardSettings } from "../storage/SettingsRepository";
import { DetectorEngine } from "./DetectorEngine";
import { ApiKeyDetector } from "./detectors/ApiKeyDetector";
import { ArgentineIdentityDetector } from "./detectors/ArgentineIdentityDetector";
import { ConfidentialKeywordDetector } from "./detectors/ConfidentialKeywordDetector";
import { ConnectionStringDetector } from "./detectors/ConnectionStringDetector";
import { CreditCardDetector } from "./detectors/CreditCardDetector";
import { EmailDetector } from "./detectors/EmailDetector";
import { FinancialInformationDetector } from "./detectors/FinancialInformationDetector";
import { JwtDetector } from "./detectors/JwtDetector";
import { PersonNameDetector } from "./detectors/PersonNameDetector";
import { PhoneDetector } from "./detectors/PhoneDetector";
import { PrivateKeyDetector } from "./detectors/PrivateKeyDetector";
import type { SensitiveDataDetector } from "./types";

export function createDetectorEngine(
  settings: PrivacyGuardSettings,
): DetectorEngine {
  const detectors: SensitiveDataDetector[] = [
    ...createCriticalDetectors(),
    new ConfidentialKeywordDetector(),
  ];

  if (settings.warningsEnabled) {
    detectors.push(
      new EmailDetector(),
      new PhoneDetector(),
      new PersonNameDetector(),
      new ArgentineIdentityDetector(),
    );
  }

  if (settings.financialDetectionEnabled) {
    detectors.push(new FinancialInformationDetector());
  }

  return new DetectorEngine(detectors);
}

export function createCriticalDetectorEngine(): DetectorEngine {
  return new DetectorEngine(createCriticalDetectors());
}

function createCriticalDetectors(): SensitiveDataDetector[] {
  return [
    new ApiKeyDetector(),
    new PrivateKeyDetector(),
    new JwtDetector(),
    new ConnectionStringDetector(),
    new CreditCardDetector(),
  ];
}
