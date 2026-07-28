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

export interface BaseRuleDescriptor {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly alwaysActive: boolean;
  readonly requiresSetting?: "warningsEnabled" | "financialDetectionEnabled";
}

const descriptionById: Record<string, string> = {
  "api-key":
    "Detecta credenciales y API keys de proveedores conocidos (OpenAI, Anthropic, AWS, GitHub, Slack, Stripe, Google, Twilio), tokens Bearer y variables tipo API_KEY=, TOKEN= o PASSWORD=.",
  "private-key":
    "Detecta bloques de clave privada en formato PEM (RSA u OpenSSH).",
  jwt: "Detecta tokens con estructura JWT; la severidad sube a crítica si aparece junto a lenguaje de autorización.",
  "connection-string":
    "Detecta cadenas de conexión a bases de datos que incluyen usuario y contraseña.",
  "credit-card":
    "Detecta números que superan la validación Luhn de tarjetas de pago.",
  "confidential-keyword":
    "Detecta los términos confidenciales que cada usuario configura localmente en el popup de la extensión.",
  email: "Detecta direcciones de email.",
  phone: "Detecta teléfonos mencionados en contexto de contacto.",
  "person-name":
    'Detecta nombres de persona en frases como "contactar a…" o "escribirle a…".',
  "argentine-identity":
    "Detecta DNI, CUIT/CUIL, CBU y alias bancario en formato argentino.",
  "financial-information":
    "Detecta montos que aparecen junto a lenguaje financiero y confidencial a la vez.",
};

const fallbackDescription = "Detector sin descripción documentada todavía.";

function baseDetectionSettings(overrides: {
  readonly warningsEnabled: boolean;
  readonly financialDetectionEnabled: boolean;
}): PrivacyGuardSettings {
  return {
    strictSecrets: true,
    confidentialTerms: [],
    counters: {
      allowedCount: 0,
      warnedCount: 0,
      blockedCount: 0,
      redactedCount: 0,
    },
    ...overrides,
  };
}

export function describeBaseRules(): readonly BaseRuleDescriptor[] {
  const alwaysActive = createDetectorEngine(
    baseDetectionSettings({
      warningsEnabled: false,
      financialDetectionEnabled: false,
    }),
  ).detectors;
  const withWarnings = createDetectorEngine(
    baseDetectionSettings({
      warningsEnabled: true,
      financialDetectionEnabled: false,
    }),
  ).detectors;
  const withFinancial = createDetectorEngine(
    baseDetectionSettings({
      warningsEnabled: false,
      financialDetectionEnabled: true,
    }),
  ).detectors;

  const alwaysActiveIds = new Set(alwaysActive.map((detector) => detector.id));
  const warningsIds = new Set(
    withWarnings
      .map((detector) => detector.id)
      .filter((id) => !alwaysActiveIds.has(id)),
  );
  const financialIds = new Set(
    withFinancial
      .map((detector) => detector.id)
      .filter((id) => !alwaysActiveIds.has(id)),
  );

  const seen = new Set<string>();
  const descriptors: BaseRuleDescriptor[] = [];

  for (const detector of [...alwaysActive, ...withWarnings, ...withFinancial]) {
    if (seen.has(detector.id)) continue;
    seen.add(detector.id);

    descriptors.push({
      id: detector.id,
      label: detector.label,
      description: descriptionById[detector.id] ?? fallbackDescription,
      alwaysActive: alwaysActiveIds.has(detector.id),
      requiresSetting: warningsIds.has(detector.id)
        ? "warningsEnabled"
        : financialIds.has(detector.id)
          ? "financialDetectionEnabled"
          : undefined,
    });
  }

  return descriptors;
}
